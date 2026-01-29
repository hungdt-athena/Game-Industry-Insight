/**
 * Convert plain text to HTML with:
 * - Line breaks → <br /> tags
 * - URLs → clickable links
 */
export function textToHtml(text: string): string {
    if (!text) return '';

    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;

    // Split by line breaks
    const lines = text.split('\n');

    // Process each line
    const processedLines = lines.map(line => {
        // Replace URLs with anchor tags
        return line.replace(urlPattern, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700 underline">${url}</a>`;
        });
    });

    // Join with <br /> tags
    return processedLines.join('<br />');
}

/**
 * Safely render content_raw with proper formatting
 */
export function formatContentRaw(content: string | null | undefined): string {
    if (!content) return '';

    // Check if content already contains HTML tags
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

    if (hasHtmlTags) {
        // Already HTML, return as-is
        return content;
    }

    // Plain text, convert to HTML
    return textToHtml(content);
}
