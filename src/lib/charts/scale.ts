/** Axis and geometry helpers shared by the chart primitives. */

export interface NiceScale {
	max: number;
	ticks: number[];
	step: number;
}

/** Round a domain up to a readable maximum with evenly spaced ticks. */
export function niceScale(maxValue: number, targetTicks = 4): NiceScale {
	if (!Number.isFinite(maxValue) || maxValue <= 0) {
		return { max: 1, ticks: [0, 1], step: 1 };
	}

	const rough = maxValue / Math.max(1, targetTicks);
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const normalised = rough / magnitude;
	const niceUnit =
		normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
	const step = niceUnit * magnitude;
	const max = Math.ceil(maxValue / step) * step;

	const ticks: number[] = [];
	for (let v = 0; v <= max + step / 2; v += step) {
		ticks.push(Number(v.toPrecision(12)));
	}

	return { max, ticks, step };
}

const clampRadius = (r: number, ...limits: number[]): number =>
	Math.max(0, Math.min(r, ...limits.map((l) => Math.max(0, l))));

/** Bar with rounded top corners, square-anchored to the baseline below it. */
export function roundedTop(x: number, y: number, w: number, h: number, r = 4): string {
	if (h <= 0 || w <= 0) return '';
	const rr = clampRadius(r, w / 2, h);
	return [
		`M${x},${y + h}`,
		`L${x},${y + rr}`,
		`Q${x},${y} ${x + rr},${y}`,
		`L${x + w - rr},${y}`,
		`Q${x + w},${y} ${x + w},${y + rr}`,
		`L${x + w},${y + h}`,
		'Z'
	].join(' ');
}

/** Bar with rounded right end, square-anchored to the axis on the left. */
export function roundedRight(x: number, y: number, w: number, h: number, r = 4): string {
	if (h <= 0 || w <= 0) return '';
	const rr = clampRadius(r, w, h / 2);
	return [
		`M${x},${y}`,
		`L${x + w - rr},${y}`,
		`Q${x + w},${y} ${x + w},${y + rr}`,
		`L${x + w},${y + h - rr}`,
		`Q${x + w},${y + h} ${x + w - rr},${y + h}`,
		`L${x},${y + h}`,
		'Z'
	].join(' ');
}

/** Plain rectangle path, used for interior stack segments. */
export function rect(x: number, y: number, w: number, h: number): string {
	if (h <= 0 || w <= 0) return '';
	return `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
}

/** Keep a floating tooltip inside its container. */
export function clampTooltip(
	x: number,
	y: number,
	tipW: number,
	tipH: number,
	boxW: number,
	boxH: number,
	pad = 8
): { left: number; top: number } {
	const left = Math.max(pad, Math.min(x - tipW / 2, boxW - tipW - pad));
	const top = y - tipH - 12 < pad ? y + 18 : y - tipH - 12;
	return { left, top: Math.max(pad, Math.min(top, boxH - tipH - pad)) };
}
