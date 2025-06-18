/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { OFSPlugin, OFSMessage, OFSOpenMessage } from "@ofs-users/plugin";

interface OFSCustomOpenMessage extends OFSOpenMessage {
    activity: any;
    openParams: any;
    resource: any;
}

export class CustomPlugin extends OFSPlugin {
    open(data: OFSCustomOpenMessage) {
        const input_data = document.getElementById("input_data");
        const statusElement = document.getElementById("status_message");
        const urlDisplayElement = document.getElementById("url_display");
        const urlLinkElement = document.getElementById("url_link");
        const copyBtnElement = document.getElementById("copy_btn");
        
        try {
            if (data.activity && data.activity.A_CUSTOM_URL) {
                const url = data.activity.A_CUSTOM_URL;
                
                if (this.isValidUrl(url)) {
                    this.showUrlAndAttemptOpen(url, statusElement, urlDisplayElement, urlLinkElement, copyBtnElement);
                } else {
                    if (statusElement) {
                        statusElement.innerHTML = `<div class="alert alert-danger">Invalid URL provided: ${url}</div>`;
                    }
                }
            } else {
                if (statusElement) {
                    statusElement.innerHTML = `<div class="alert alert-warning">No A_CUSTOM_URL parameter found in activity</div>`;
                }
            }
            
            if (input_data) {
                input_data.textContent = JSON.stringify(data, null, 2);
            }
        } catch (error) {
            if (statusElement) {
                statusElement.innerHTML = `<div class="alert alert-danger">Error processing URL: ${error}</div>`;
            }
        }
    }
    
    private showUrlAndAttemptOpen(url: string, statusElement: HTMLElement | null, urlDisplayElement: HTMLElement | null, urlLinkElement: HTMLElement | null, copyBtnElement: HTMLElement | null) {
        // Show the URL to the user
        if (urlDisplayElement && urlLinkElement) {
            urlLinkElement.textContent = url;
            urlLinkElement.onclick = () => this.attemptToOpenUrl(url, statusElement);
            urlDisplayElement.style.display = 'block';
        }
        
        // Setup copy button
        if (copyBtnElement) {
            copyBtnElement.onclick = () => this.copyToClipboard(url);
        }
        
        // Try to open the URL automatically
        this.attemptToOpenUrl(url, statusElement);
    }
    
    private attemptToOpenUrl(url: string, statusElement: HTMLElement | null) {
        let opened = false;
        let method = '';
        
        try {
            // Try window.top.open first (most likely to work in nested iframe)
            if (window.top && window.top !== window) {
                const newWindow = window.top.open(url, '_blank');
                if (newWindow) {
                    opened = true;
                    method = 'top window';
                }
            }
        } catch (e) {
            // Ignore security errors
        }
        
        if (!opened) {
            try {
                // Try window.parent.open
                if (window.parent && window.parent !== window) {
                    const newWindow = window.parent.open(url, '_blank');
                    if (newWindow) {
                        opened = true;
                        method = 'parent window';
                    }
                }
            } catch (e) {
                // Ignore security errors
            }
        }
        
        if (!opened) {
            try {
                // Try regular window.open as fallback
                const newWindow = window.open(url, '_blank');
                if (newWindow) {
                    opened = true;
                    method = 'current window';
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        // Show status message
        if (statusElement) {
            if (opened) {
                statusElement.innerHTML = `<div class="alert alert-success">URL opened successfully via ${method}! If it didn't open, click the URL below.</div>`;
            } else {
                statusElement.innerHTML = `<div class="alert alert-warning">Unable to automatically open URL due to browser restrictions. Please click the URL below to open it manually.</div>`;
            }
        }
    }
    
    private copyToClipboard(url: string) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                alert('URL copied to clipboard!');
            }).catch(() => {
                this.fallbackCopyTextToClipboard(url);
            });
        } else {
            this.fallbackCopyTextToClipboard(url);
        }
    }
    
    private fallbackCopyTextToClipboard(text: string) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('URL copied to clipboard!');
            } else {
                alert('Failed to copy URL. Please copy it manually.');
            }
        } catch (err) {
            alert('Failed to copy URL. Please copy it manually.');
        }
        
        document.body.removeChild(textArea);
    }
    
    private isValidUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}
