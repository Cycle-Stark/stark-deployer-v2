/**
 * Reads the content of a file as text
 * @param file - The file to read
 * @returns Promise that resolves to the file content as string
 */
export function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('Failed to read file as text'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
        };
        
        reader.onabort = () => {
            reject(new Error('File reading was aborted'));
        };
        
        try {
            reader.readAsText(file);
        } catch (error) {
            reject(new Error(`Error starting file read: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}

/**
 * Validates if a file is a valid JSON file
 * @param file - The file to validate
 * @returns Promise that resolves to true if valid JSON, false otherwise
 */
export async function isValidJsonFile(file: File): Promise<boolean> {
    try {
        // Check file extension
        if (!file.name.toLowerCase().endsWith('.json')) {
            return false;
        }
        
        const content = await readFileContent(file);
        JSON.parse(content);
        return true;
    } catch {
        return false;
    }
}

/**
 * Reads and parses a JSON file
 * @param file - The JSON file to read and parse
 * @returns Promise that resolves to the parsed JSON object
 */
export async function readJsonFile<T = any>(file: File): Promise<T> {
    try {
        const content = await readFileContent(file);
        return JSON.parse(content) as T;
    } catch (error) {
        throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Formats file size in human readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'kB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validates file type and size
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types or file extensions
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @returns Validation result with success status and error message
 */
export function validateFile(
    file: File, 
    allowedTypes: string[] = ['.json'], 
    maxSize: number = 10 * 1024 * 1024 // 10MB
): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`
        };
    }
    
    // Check file type
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    const isTypeAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
            // Extension check
            return fileName.endsWith(type.toLowerCase());
        } else {
            // MIME type check
            return fileType === type.toLowerCase();
        }
    });
    
    if (!isTypeAllowed) {
        return {
            isValid: false,
            error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }
    
    return { isValid: true };
}

/**
 * Reads multiple files concurrently
 * @param files - Array of files to read
 * @returns Promise that resolves to array of file contents
 */
export async function readMultipleFiles(files: File[]): Promise<string[]> {
    try {
        const promises = files.map(file => readFileContent(file));
        return await Promise.all(promises);
    } catch (error) {
        throw new Error(`Failed to read multiple files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Creates a download link for text content
 * @param content - Text content to download
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file (default: text/plain)
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


export function customSerializer(obj: any): string{
    return JSON.stringify(obj, (key, value) => {
        if(typeof value === 'bigint'){
            return value.toString()
        }
        return value
    })
}

export function serializeBigInt(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if(typeof value === 'bigint'){
            return value.toString()
        }
        return value
    }))
}