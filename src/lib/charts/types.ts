/** Shared shapes for the two chart primitives. */

export interface Series {
	key: string;
	label: string;
	color: string;
}

export interface Segment {
	key: string;
	value: number;
}

/** A vertical column in ColumnChart. */
export interface Column {
	key: string;
	label: string;
	fullLabel?: string;
	segments: Segment[];
	total: number;
	/** Optional extra line at the bottom of the tooltip. */
	foot?: string;
}

/** A horizontal row in BarChart. */
export interface Row {
	key: string;
	label: string;
	sublabel?: string;
	href?: string;
	segments: Segment[];
	total: number;
	foot?: string;
}

/** Shaded background region spanning a range of column keys. */
export interface Band {
	from: string;
	to: string;
	label: string;
}
