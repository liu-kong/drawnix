// Advanced Drawnix Integration for Recent Files
// This script provides deeper integration with the Drawnix app's file operations

(function() {
    'use strict';

    if (typeof window.__TAURI__ === 'undefined') {
        console.warn('Tauri API not available');
        return;
    }

    const { invoke } = window.__TAURI__.core;

    // Enhanced file operations that integrate with recent files
    window.drawnixFileOps = {
        async saveAsDrawnixFile(boardData, fileName) {
            try {
                // Use Tauri's dialog to save file
                const { save } = window.__TAURI__.dialog;
                
                const filePath = await save({
                    defaultPath: `${fileName}.drawnix`,
                    filters: [{
                        name: 'Drawnix Files',
                        extensions: ['drawnix']
                    }]
                });

                if (filePath) {
                    const content = JSON.stringify(boardData, null, 2);
                    await invoke('save_file_with_tracking', {
                        content: content,
                        file_path: filePath
                    });
                    return { success: true, filePath };
                }
                return { success: false, cancelled: true };
            } catch (error) {
                console.error('Failed to save file:', error);
                return { success: false, error };
            }
        },

        async openDrawnixFile() {
            try {
                // Use Tauri's dialog to open file
                const { open } = window.__TAURI__.dialog;
                
                const filePath = await open({
                    multiple: false,
                    filters: [{
                        name: 'Drawnix Files',
                        extensions: ['drawnix', 'json']
                    }]
                });

                if (filePath) {
                    const content = await invoke('load_file_with_tracking', {
                        file_path: filePath
                    });
                    
                    const data = JSON.parse(content);
                    return { success: true, data, filePath };
                }
                return { success: false, cancelled: true };
            } catch (error) {
                console.error('Failed to open file:', error);
                return { success: false, error };
            }
        },

        async loadRecentFile(filePath) {
            try {
                const content = await invoke('load_file_with_tracking', {
                    file_path: filePath
                });
                
                const data = JSON.parse(content);
                return { success: true, data, filePath };
            } catch (error) {
                console.error('Failed to load recent file:', error);
                return { success: false, error };
            }
        }
    };

    // Override existing file operations
    let originalSaveAsJSON = null;
    let originalLoadFromJSON = null;
    let boardInstance = null;

    // Function to enhance existing Drawnix functions
    function enhanceDrawnixFileOperations() {
        // Wait for the app and its functions to be available
        const checkInterval = setInterval(() => {
            // Look for signs that the Drawnix app is ready
            const appElement = document.querySelector('.drawnix');
            
            if (appElement && window.__drawnix__web__console) {
                clearInterval(checkInterval);
                
                // Set up event listeners for custom file operations
                setupCustomFileHandlers();
                
                console.log('Drawnix file operations enhanced with recent files support');
            }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    function setupCustomFileHandlers() {
        // Listen for custom file load events
        document.addEventListener('drawnix-load-file', async (event) => {
            const { data, filePath } = event.detail;
            
            try {
                // Find the board instance (this is a simplified approach)
                // In reality, we'd need to access the React context or state
                console.log('Loading file data into Drawnix:', filePath);
                
                // Simulate the loading process - in practice this would need
                // deeper integration with the React components
                if (typeof window.loadDrawnixData === 'function') {
                    window.loadDrawnixData(data);
                } else {
                    // Fallback: try to trigger the existing load mechanism
                    const openButton = document.querySelector('[data-testid="open-button"]');
                    if (openButton) {
                        console.log('Triggering existing open mechanism...');
                        // This is a simplified approach - real implementation would need
                        // direct access to the React state management
                    }
                }
            } catch (error) {
                console.error('Failed to load file into Drawnix:', error);
            }
        });

        // Hook into save operations to track recent files
        document.addEventListener('click', async (event) => {
            const saveButton = event.target.closest('[data-testid="save-button"]');
            if (saveButton) {
                // Add a small delay to let the original save complete
                setTimeout(async () => {
                    try {
                        // This is a simplified approach - we'd need access to the actual file path
                        // from the save operation. In practice, we'd need to intercept the 
                        // file save dialog result.
                        console.log('Save operation detected - would track in recent files');
                    } catch (error) {
                        console.error('Failed to track saved file:', error);
                    }
                }, 100);
            }
        });
    }

    // CSS for better menu integration
    const advancedCSS = `
        .recent-files-menu-item .menu-item-content {
            display: flex;
            align-items: center;
            padding: 8px 12px;
        }
        
        .recent-files-menu-item .menu-item-icon {
            margin-right: 8px;
            display: flex;
            align-items: center;
        }
        
        .recent-files-menu-item .menu-item-label {
            flex: 1;
        }
        
        .recent-files-menu-item .menu-item-submenu-trigger {
            margin-left: auto;
            opacity: 0.6;
        }
        
        .recent-files-submenu {
            position: absolute;
            left: 100%;
            top: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            min-width: 280px;
        }
        
        .recent-files-list {
            padding: 4px;
        }
        
        .recent-file-item {
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .recent-file-item:hover {
            background-color: #f0f9ff;
        }
        
        .recent-file-name {
            font-weight: 500;
            font-size: 13px;
            color: #1f2937;
            margin-bottom: 2px;
        }
        
        .recent-file-time {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 2px;
        }
        
        .recent-file-path {
            font-size: 10px;
            color: #9ca3af;
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .recent-files-empty {
            padding: 16px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            font-style: italic;
        }
    `;

    // Inject advanced CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = advancedCSS;
    document.head.appendChild(styleElement);

    // Initialize the enhancement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceDrawnixFileOperations);
    } else {
        enhanceDrawnixFileOperations();
    }

    console.log('Advanced Drawnix integration loaded');
})();
