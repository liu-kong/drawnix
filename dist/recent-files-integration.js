// Recent Files Integration for Drawnix Tauri App

(function() {
    'use strict';
    
    // Check if Tauri API is available
    if (typeof window.__TAURI__ === 'undefined') {
        console.warn('Tauri API not available');
        return;
    }

    const { invoke } = window.__TAURI__.core;
    
    // Recent files API wrapper
    window.recentFilesAPI = {
        async getRecentFiles() {
            try {
                return await invoke('get_recent_files');
            } catch (error) {
                console.error('Failed to get recent files:', error);
                return [];
            }
        },
        
        async addToRecentFiles(filePath, preview = null) {
            try {
                await invoke('add_to_recent_files', { 
                    file_path: filePath, 
                    preview: preview 
                });
            } catch (error) {
                console.error('Failed to add to recent files:', error);
            }
        },
        
        async removeRecentFile(filePath) {
            try {
                await invoke('remove_recent_file', { file_path: filePath });
            } catch (error) {
                console.error('Failed to remove recent file:', error);
            }
        },
        
        async clearRecentFiles() {
            try {
                await invoke('clear_recent_files');
            } catch (error) {
                console.error('Failed to clear recent files:', error);
            }
        }
    };

    // Format timestamp to readable format
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }

    // Create recent files menu HTML
    function createRecentFilesMenu(recentFiles) {
        if (!recentFiles || recentFiles.length === 0) {
            return '<div class="recent-files-empty">No recent files</div>';
        }

        let menuHTML = '<div class="recent-files-list">';
        recentFiles.forEach((file, index) => {
            menuHTML += `
                <div class="recent-file-item" data-file-path="${file.path}" data-index="${index}">
                    <div class="recent-file-name">${file.name}</div>
                    <div class="recent-file-time">${formatTimestamp(file.last_modified)}</div>
                    <div class="recent-file-path" title="${file.path}">${file.path}</div>
                </div>
            `;
        });
        menuHTML += '</div>';
        
        return menuHTML;
    }

    // Style for recent files menu
    const recentFilesCSS = `
        .recent-files-list {
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .recent-file-item {
            padding: 8px 12px;
            border-bottom: 1px solid #e0e0e0;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .recent-file-item:hover {
            background-color: #f5f5f5;
        }
        
        .recent-file-item:last-child {
            border-bottom: none;
        }
        
        .recent-file-name {
            font-weight: 600;
            font-size: 14px;
            color: #333;
            margin-bottom: 2px;
        }
        
        .recent-file-time {
            font-size: 11px;
            color: #666;
            margin-bottom: 2px;
        }
        
        .recent-file-path {
            font-size: 11px;
            color: #999;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .recent-files-empty {
            padding: 20px;
            text-align: center;
            color: #666;
            font-style: italic;
        }
    `;

    // Inject CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = recentFilesCSS;
    document.head.appendChild(styleElement);

    // Store original file operations for modification
    let originalFileOperations = {};

    // Override file operations to track recent files
    function enhanceFileOperations() {
        // Wait for the app to initialize
        const checkForDrawnix = setInterval(() => {
            if (window.__drawnix__web__console) {
                clearInterval(checkForDrawnix);
                initializeRecentFilesIntegration();
            }
        }, 100);
    }

    function initializeRecentFilesIntegration() {
        // Wait for menu to be available
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Look for the app menu
                        const menuItems = node.querySelectorAll('[data-testid="save-button"], [data-testid="open-button"]');
                        if (menuItems.length > 0) {
                            enhanceMenuWithRecentFiles(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also check existing menus
        enhanceExistingMenus();
    }

    function enhanceExistingMenus() {
        const menus = document.querySelectorAll('.menu-container');
        menus.forEach(menu => enhanceMenuWithRecentFiles(menu));
    }

    async function enhanceMenuWithRecentFiles(menuContainer) {
        // Check if already enhanced
        if (menuContainer.querySelector('.recent-files-menu-item')) {
            return;
        }

        // Find the open file menu item
        const openButton = menuContainer.querySelector('[data-testid="open-button"]');
        if (openButton && openButton.closest('.menu-item')) {
            const openMenuItem = openButton.closest('.menu-item');
            
            // Create recent files menu item
            const recentFilesMenuItem = document.createElement('div');
            recentFilesMenuItem.className = 'menu-item recent-files-menu-item';
            recentFilesMenuItem.innerHTML = `
                <div class="menu-item-content">
                    <div class="menu-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18V9l-6-6H3z"/>
                            <path d="M15 3v6h6"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                    </div>
                    <div class="menu-item-label">Recent Files</div>
                    <div class="menu-item-submenu-trigger">›</div>
                </div>
            `;

            // Get recent files and create submenu
            const recentFiles = await window.recentFilesAPI.getRecentFiles();
            const submenu = document.createElement('div');
            submenu.className = 'menu submenu recent-files-submenu';
            submenu.innerHTML = createRecentFilesMenu(recentFiles);
            submenu.style.display = 'none';

            recentFilesMenuItem.appendChild(submenu);

            // Add event listeners
            recentFilesMenuItem.addEventListener('mouseenter', () => {
                submenu.style.display = 'block';
            });

            recentFilesMenuItem.addEventListener('mouseleave', () => {
                submenu.style.display = 'none';
            });

            // Add click handlers for recent file items
            submenu.addEventListener('click', async (e) => {
                const fileItem = e.target.closest('.recent-file-item');
                if (fileItem) {
                    const filePath = fileItem.getAttribute('data-file-path');
                    await loadRecentFile(filePath);
                }
            });

            // Insert after open button
            openMenuItem.parentNode.insertBefore(recentFilesMenuItem, openMenuItem.nextSibling);
        }
    }

    async function loadRecentFile(filePath) {
        try {
            console.log('Loading recent file:', filePath);
            
            // Use Tauri's file system API to read the file
            const { readTextFile } = window.__TAURI__.fs;
            const fileContent = await readTextFile(filePath);
            
            // Parse the JSON content
            const drawingData = JSON.parse(fileContent);
            
            // Trigger file load in the app by simulating the existing open flow
            const event = new CustomEvent('drawnix-load-file', {
                detail: {
                    data: drawingData,
                    filePath: filePath
                }
            });
            document.dispatchEvent(event);
            
            console.log('Recent file loaded successfully');
        } catch (error) {
            console.error('Failed to load recent file:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceFileOperations);
    } else {
        enhanceFileOperations();
    }

    console.log('Recent Files integration loaded');
})();
