#!/usr/bin/env bun
/** Unified CAD build + render CLI — progressive TUI with parallel execution */

import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { MultiBar, Presets } from "cli-progress";

// --- Config ---

const VIEWS = [
	{ name: "iso-A", rx: 54.74, ry: 0, rz: 315 },
	{ name: "front", rx: 90, ry: 0, rz: 0 },
	{ name: "iso-B", rx: 54.74, ry: 0, rz: 135 },
	{ name: "left", rx: 90, ry: 0, rz: 270 },
	{ name: "top", rx: 0, ry: 0, rz: 0 },
	{ name: "right", rx: 90, ry: 0, rz: 90 },
	{ name: "iso-C", rx: 125.26, ry: 0, rz: 45 },
	{ name: "bottom", rx: 180, ry: 0, rz: 0 },
	{ name: "back", rx: 90, ry: 0, rz: 180 },
];

const IMGSIZE = "1024,1024";
const COLORSCHEME = "Starnight";
const MAX_CONCURRENT = 3;
const ROOT = resolve(import.meta.dir);
const PROJECTS_DIR = join(ROOT, "src");

// --- Helpers ---

type Action = "render" | "build";
type ProgressFn = (step: number, total: number, label: string) => void;

const isScad = (f: string) => f.endsWith(".scad") && !/\.v\d/.test(f);

async function prompt<T>(promise: Promise<T | symbol>) {
	const result = await promise;
	if (p.isCancel(result)) {
		p.cancel("Cancelled.");
		process.exit(0);
	}
	return result;
}

function discoverProjects() {
	return readdirSync(PROJECTS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory() && existsSync(join(PROJECTS_DIR, d.name, "src")))
		.map((d) => d.name)
		.filter((name) => readdirSync(join(PROJECTS_DIR, name, "src")).some(isScad))
		.sort();
}

function findScadFile(project: string) {
	const srcDir = join(PROJECTS_DIR, project, "src");
	const file = readdirSync(srcDir).find(isScad);
	if (!file) throw new Error(`No .scad source found for ${project}`);
	return join(srcDir, file);
}

function findOpenSCAD() {
	const result = Bun.spawnSync(["which", "openscad"]);
	if (result.exitCode === 0) return result.stdout.toString().trim();
	const macPath = "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD";
	if (existsSync(macPath)) return macPath;
	throw new Error("openscad not found — install it first");
}

async function run(cmd: string, args: string[], ignoreExit = false) {
	const proc = Bun.spawn([cmd, ...args], { stderr: "ignore", stdout: "ignore" });
	const code = await proc.exited;
	if (code !== 0 && !ignoreExit)
		throw new Error(`${cmd} exited with code ${code}`);
	return code;
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number) {
	const results: T[] = [];
	let i = 0;
	async function worker() {
		while (i < tasks.length) {
			const idx = i++;
			results[idx] = await tasks[idx]();
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(limit, tasks.length) }, () => worker()),
	);
	return results;
}

// --- Actions ---

async function renderProject(
	openscad: string,
	project: string,
	onProgress: ProgressFn,
) {
	const scad = findScadFile(project);
	const tmp = mkdtempSync(join(tmpdir(), `cad-render-${project}-`));
	const tiles: string[] = [];
	const total = VIEWS.length + 1;

	for (let i = 0; i < VIEWS.length; i++) {
		const view = VIEWS[i];
		onProgress(i, total, view.name);
		const outFile = join(tmp, `${view.name}.png`);
		await run(openscad, [
			"--preview",
			"--projection=ortho",
			`--imgsize=${IMGSIZE}`,
			"--viewall",
			"--autocenter",
			`--colorscheme=${COLORSCHEME}`,
			`--camera=0,0,0,${view.rx},${view.ry},${view.rz},0`,
			"-o",
			outFile,
			scad,
		]);
		tiles.push(outFile);
	}

	onProgress(VIEWS.length, total, "montage");
	await run(
		"magick",
		[
			"montage",
			...tiles,
			"-tile",
			"3x3",
			"-geometry",
			"1024x1024+0+0",
			join(PROJECTS_DIR, project, "render.png"),
		],
		true,
	);

	onProgress(total, total, "done");
	rmSync(tmp, { recursive: true });
}

async function buildProject(
	openscad: string,
	project: string,
	onProgress: ProgressFn,
) {
	const scad = findScadFile(project);
	onProgress(0, 1, "building");
	await run(openscad, ["-o", join(PROJECTS_DIR, project, `${project}.stl`), scad]);
	onProgress(1, 1, "done");
}

const actionFn: Record<Action, typeof renderProject> = {
	render: renderProject,
	build: buildProject,
};

const actionSteps: Record<Action, number> = {
	render: VIEWS.length + 1,
	build: 1,
};

// --- CLI ---

async function main() {
	const argv = process.argv.slice(2);
	const flags = new Set(argv.filter((a) => a.startsWith("-")));
	const positional = argv.filter((a) => !a.startsWith("-"));
	const allProjects = discoverProjects();

	let actions: Action[] = [];
	if (flags.has("--render") || flags.has("-r")) actions.push("render");
	if (flags.has("--build") || flags.has("-b")) actions.push("build");

	let projects: string[] = [];
	if (flags.has("--all") || flags.has("-a")) {
		projects = allProjects;
	} else if (positional.length > 0) {
		const unknown = positional.find((n) => !allProjects.includes(n));
		if (unknown) {
			console.error(`${chalk.red("error")} Unknown project: ${unknown}`);
			console.error(`  Available: ${allProjects.join(", ")}`);
			process.exit(1);
		}
		projects = positional;
	}

	const interactive = actions.length === 0 || projects.length === 0;
	if (interactive) p.intro(chalk.bold("cad"));

	if (actions.length === 0) {
		actions = await prompt(
			p.multiselect({
				message: "What would you like to do?",
				options: [
					{
						value: "render" as Action,
						label: "Render previews",
						hint: "3x3 composite PNG",
					},
					{
						value: "build" as Action,
						label: "Build STLs",
						hint: "printable .stl files",
					},
				],
				required: true,
			}),
		);
	}

	if (projects.length === 0) {
		projects = await prompt(
			p.multiselect({
				message: "Which projects?",
				options: allProjects.map((name) => ({ value: name, label: name })),
				required: true,
			}),
		);
	}

	let openscad: string;
	try {
		openscad = findOpenSCAD();
	} catch {
		if (interactive) p.cancel("openscad not found. Install it first.");
		else console.error(`${chalk.red("error")} openscad not found. Install it first.`);
		process.exit(1);
	}

	const tasks = projects.flatMap((project) =>
		actions.map((action) => ({
			project,
			action,
			label: `${action === "render" ? "Render" : "Build "} ${project}`,
			total: actionSteps[action],
		})),
	);

	if (interactive) console.log();

	const multibar = new MultiBar(
		{
			clearOnComplete: false,
			hideCursor: true,
			format: ` ${chalk.cyan("{bar}")} {percentage}% | {task} | ${chalk.dim("{step}")}`,
			barCompleteChar: "\u2588",
			barIncompleteChar: "\u2591",
			barsize: 24,
		},
		Presets.shades_grey,
	);

	const bars = tasks.map((t) => ({
		...t,
		bar: multibar.create(t.total, 0, { task: t.label, step: "waiting" }),
	}));

	const errors: { label: string; error: Error }[] = [];

	await runWithConcurrency(
		bars.map(({ bar, project, action, total, label }) => async () => {
			const onProgress: ProgressFn = (step, _total, stepLabel) => {
				bar.update(step, { task: label, step: stepLabel });
			};
			try {
				await actionFn[action](openscad, project, onProgress);
				bar.update(total, { task: label, step: chalk.green("done") });
			} catch (err) {
				bar.update(0, { task: label, step: chalk.red("failed") });
				errors.push({ label, error: err as Error });
			}
			bar.stop();
		}),
		MAX_CONCURRENT,
	);

	multibar.stop();

	if (errors.length > 0) {
		console.log();
		for (const { label, error } of errors)
			console.error(`${chalk.red("\u2717")} ${label}: ${error.message}`);
		process.exit(1);
	}

	if (interactive) p.outro(chalk.green("Done!"));
	else console.log(`\n${chalk.green("Done.")}`);
}

main().catch((err) => {
	if (err?.name === "ExitPromptError") {
		console.log("\nCancelled.");
		process.exit(0);
	}
	console.error(err);
	process.exit(1);
});
