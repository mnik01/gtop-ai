export const getHash = async (input: string): Promise<string> => {
	return await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(hashBuffer => {
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	});
}
