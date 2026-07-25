// The canonical dataset is imported as raw text and parsed at module load.
declare module '*.csv?raw' {
	const contents: string;
	export default contents;
}
