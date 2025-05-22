document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const csvFileInput = document.getElementById('csvFileInput');
    const uploadCsvButton = document.getElementById('uploadCsvButton');
    const csvPreview = document.getElementById('csvPreview');
    const resourcesContainer = document.getElementById('resourcesContainer');
    const fileDetailsElement = document.getElementById('fileDetails');
    const uploadProgressElement = document.getElementById('uploadProgress');
    const progressBarElement = document.getElementById('progressBar');
    const progressStatusElement = document.getElementById('progressStatus');
    
    // API endpoints
    const API_URL = '/api';
    const ENDPOINTS = {
        GET_RESOURCES: `${API_URL}/resources`,
        ADD_RESOURCE: `${API_URL}/resources`,
        DELETE_RESOURCE: `${API_URL}/resources`
    };
    
    // Load resources from API
    loadResources();
    
    // CSV Upload and Parsing
    let parsedCsvData = [];
    
    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Display file details
            displayFileDetails(file);
            
            // Show progress bar
            uploadProgressElement.style.display = 'block';
            progressBarElement.style.width = '0%';
            progressStatusElement.textContent = '0%';
            
            const reader = new FileReader();
            
            reader.onprogress = function(event) {
                if (event.lengthComputable) {
                    const percentLoaded = Math.round((event.loaded / event.total) * 100);
                    progressBarElement.style.width = percentLoaded + '%';
                    progressStatusElement.textContent = percentLoaded + '%';
                }
            };
            
            reader.onload = function(event) {
                // Set progress to 100% when load completes
                progressBarElement.style.width = '100%';
                progressStatusElement.textContent = '100%';
                
                // Parse CSV data
                const csvContent = event.target.result;
                progressBarElement.style.width = '50%'; // Reset to 50% for parsing phase
                progressStatusElement.textContent = 'Parsing data...';
                
                // Use setTimeout to allow UI to update before potentially heavy parsing
                setTimeout(() => {
                    try {
                        parsedCsvData = parseCSV(csvContent);
                        displayCsvPreview(parsedCsvData);
                        
                        // Update progress to complete
                        progressBarElement.style.width = '100%';
                        progressStatusElement.textContent = 'Ready to upload';
                        
                        // Hide progress after 2 seconds
                        setTimeout(() => {
                            uploadProgressElement.style.display = 'none';
                        }, 2000);
                    } catch (error) {
                        progressStatusElement.textContent = 'Error: ' + error.message;
                        progressBarElement.style.backgroundColor = '#e74c3c'; // Red for error
                    }
                }, 100);
            };
            
            reader.onerror = function() {
                progressStatusElement.textContent = 'Error reading file';
                progressBarElement.style.backgroundColor = '#e74c3c'; // Red for error
            };
            
            reader.readAsText(file);
        } else {
            // Reset if no file selected
            fileDetailsElement.innerHTML = '<div class="no-file-selected">No file selected</div>';
            uploadProgressElement.style.display = 'none';
            csvPreview.innerHTML = '';
        }
    });
    
    function displayFileDetails(file) {
        // Format file size
        let fileSize = file.size;
        let fileSizeFormatted = '';
        
        if (fileSize < 1024) {
            fileSizeFormatted = fileSize + ' bytes';
        } else if (fileSize < 1024 * 1024) {
            fileSizeFormatted = (fileSize / 1024).toFixed(2) + ' KB';
        } else {
            fileSizeFormatted = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
        }
        
        // Format last modified date
        const lastModified = new Date(file.lastModified);
        const lastModifiedFormatted = lastModified.toLocaleString();
        
        // Create file details HTML
        fileDetailsElement.innerHTML = `
            <div class="file-info">
                <div class="file-info-item">
                    <div class="file-info-label">File Name:</div>
                    <div class="file-info-value">${file.name}</div>
                </div>
                <div class="file-info-item">
                    <div class="file-info-label">File Type:</div>
                    <div class="file-info-value">${file.type || 'text/csv'}</div>
                </div>
                <div class="file-info-item">
                    <div class="file-info-label">File Size:</div>
                    <div class="file-info-value">${fileSizeFormatted}</div>
                </div>
                <div class="file-info-item">
                    <div class="file-info-label">Last Modified:</div>
                    <div class="file-info-value">${lastModifiedFormatted}</div>
                </div>
            </div>
        `;
    }
    
    uploadCsvButton.addEventListener('click', function() {
        if (parsedCsvData.length > 0) {
            // Show progress bar for upload process
            uploadProgressElement.style.display = 'block';
            progressBarElement.style.width = '0%';
            progressStatusElement.textContent = 'Starting upload...';
            
            // Process resources with visual feedback
            processResourcesWithProgress(parsedCsvData);
        } else {
            alert('Please select a CSV file first');
        }
    });
    
    function processResourcesWithProgress(data) {
        const totalItems = data.length;
        let processedItems = 0;
        let successCount = 0;
        
        // Process items with a small delay between each to show progress
        function processNextItem(index) {
            if (index >= totalItems) {
                // All items processed
                progressBarElement.style.width = '100%';
                progressStatusElement.textContent = `Upload complete! Added ${successCount} resources.`;
                
                // Clear the preview and file input
                setTimeout(() => {
                    csvPreview.innerHTML = '';
                    fileDetailsElement.innerHTML = '<div class="no-file-selected">No file selected</div>';
                    csvFileInput.value = '';
                    parsedCsvData = [];
                    
                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'success-message';
                    successMessage.textContent = `Resources added successfully! (${successCount} of ${totalItems})`;
                    csvPreview.appendChild(successMessage);
                    
                    // Reload resources to show new additions
                    loadResources();
                    
                    // Hide progress bar after a delay
                    setTimeout(() => {
                        uploadProgressElement.style.display = 'none';
                        
                        // Remove success message after 3 seconds
                        setTimeout(() => {
                            successMessage.remove();
                        }, 3000);
                    }, 1000);
                }, 500);
                
                return;
            }
            
            // Update progress
            processedItems++;
            const percentComplete = Math.round((processedItems / totalItems) * 100);
            progressBarElement.style.width = percentComplete + '%';
            progressStatusElement.textContent = `Processing item ${processedItems} of ${totalItems} (${percentComplete}%)`;
            
            // Create the resource via API
            saveResource(data[index])
                .then(success => {
                    if (success) successCount++;
                    
                    // Process next item with a small delay
                    setTimeout(() => {
                        processNextItem(index + 1);
                    }, 200); // 200ms delay between items for visual feedback
                })
                .catch(error => {
                    console.error('Error saving resource:', error);
                    // Continue with next item even if there was an error
                    setTimeout(() => {
                        processNextItem(index + 1);
                    }, 200);
                });
        }
        
        // Start processing
        processNextItem(0);
    }
    
    // Function to save a resource to the database via API
    async function saveResource(item) {
        try {
            // For now, simulate API call with localStorage
            // In a real implementation, this would be an actual API call
            const resources = JSON.parse(localStorage.getItem('snuffResources') || '[]');
            
            // Add unique ID and timestamp
            item.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            item.createdAt = new Date().toISOString();
            
            resources.push(item);
            localStorage.setItem('snuffResources', JSON.stringify(resources));
            
            return true;
        } catch (error) {
            console.error('Error saving resource:', error);
            return false;
        }
    }
    
    // Function to load resources from the database via API
    async function loadResources() {
        try {
            // Show loading message
            resourcesContainer.innerHTML = '<div class="loading-message">Loading resources...</div>';
            
            // For now, simulate API call with localStorage
            // In a real implementation, this would be an actual API call
            const resources = JSON.parse(localStorage.getItem('snuffResources') || '[]');
            
            // Clear container
            resourcesContainer.innerHTML = '';
            
            if (resources.length === 0) {
                resourcesContainer.innerHTML = '<div class="loading-message">No resources found. Upload some using CSV!</div>';
                return;
            }
            
            // Create resource cards
            resources.forEach(item => createResourceCard(item));
            
            // Initialize animation for cards
            initializeCardAnimations();
            
        } catch (error) {
            console.error('Error loading resources:', error);
            resourcesContainer.innerHTML = '<div class="loading-message">Error loading resources. Please try again.</div>';
        }
    }
    
    // Function to create a resource card
    function createResourceCard(item) {
        // Check if all required fields are present
        if (!item.Title || !item.URL) {
            console.error('Missing required fields in resource:', item);
            return;
        }
        
        // Ensure category is set
        if (!item.Category) {
            item.Category = detectCategory(item.URL, item.Title);
        }
        
        // Ensure description is set
        if (!item.Description) {
            item.Description = `Resource for ${item.Title}`;
        }
        
        // Create resource card
        const card = document.createElement('div');
        card.className = `resource-card ${item.Category.toLowerCase()}`;
        card.dataset.id = item.id;
        
        // Determine icon based on category
        let iconClass = 'fas fa-link';
        switch (item.Category.toLowerCase()) {
            case 'forums':
                iconClass = 'fas fa-comments';
                break;
            case 'youtube':
                iconClass = 'fab fa-youtube';
                break;
            case 'stores':
                iconClass = 'fas fa-store';
                break;
            case 'manufacturers':
                iconClass = 'fas fa-industry';
                break;
            case 'info':
                iconClass = 'fas fa-info-circle';
                break;
        }
        
        // Special handling for YouTube URLs
        let linkText = 'Visit Website';
        let additionalContent = '';
        
        if (item.Category.toLowerCase() === 'youtube') {
            linkText = 'Watch on YouTube';
            
            // Extract video ID if it's a YouTube URL
            const videoId = extractYouTubeVideoId(item.URL);
            if (videoId) {
                // Add thumbnail preview for YouTube videos
                additionalContent = `
                    <div class="youtube-preview">
                        <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="${item.Title} thumbnail">
                    </div>
                `;
            }
        }
        
        card.innerHTML = `
            <div class="resource-icon"><i class="${iconClass}"></i></div>
            <div class="resource-content">
                <h3>${item.Title}</h3>
                ${additionalContent}
                <p>${item.Description}</p>
                <a href="${item.URL}" target="_blank" class="resource-link">${linkText} <i class="fas fa-external-link-alt"></i></a>
            </div>
        `;
        
        resourcesContainer.appendChild(card);
    }
    
    function extractYouTubeVideoId(url) {
        if (!url) return null;
        
        // Try to extract video ID from various YouTube URL formats
        let videoId = null;
        
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
        if (watchMatch) return watchMatch[1];
        
        // Format: https://youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch) return shortMatch[1];
        
        // Format: https://www.youtube.com/embed/VIDEO_ID
        const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
        if (embedMatch) return embedMatch[1];
        
        // Format: https://www.youtube.com/v/VIDEO_ID
        const vMatch = url.match(/youtube\.com\/v\/([^?&]+)/);
        if (vMatch) return vMatch[1];
        
        return null;
    }
    
    function parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty or has only headers');
        }
        
        const result = [];
        
        // Handle headers
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Map different column names to our expected fields
        const columnMapping = {
            // Title column could be named any of these
            title: ['Title', 'Channel Name', 'Name', 'Resource Name', 'Channel'],
            // URL column could be named any of these
            url: ['URL', 'Link', 'Website', 'Address'],
            // Category column could be named any of these
            category: ['Category', 'Type', 'Resource Type'],
            // Description column could be named any of these
            description: ['Description', 'Details', 'Info', 'Summary']
        };
        
        // Find the actual column indices for each expected field
        const fieldIndices = {};
        
        // First try to match by header names
        for (const [field, possibleNames] of Object.entries(columnMapping)) {
            for (let i = 0; i < headers.length; i++) {
                if (possibleNames.includes(headers[i])) {
                    fieldIndices[field] = i;
                    break;
                }
            }
        }
        
        // If we couldn't find the required columns by name, try to infer from data
        if (fieldIndices.title === undefined || fieldIndices.url === undefined) {
            console.log('Could not identify columns by name, attempting to infer from data...');
            
            // Parse the first few rows to analyze data patterns
            const sampleRows = [];
            const maxSampleRows = Math.min(5, lines.length - 1);
            
            for (let i = 1; i <= maxSampleRows; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Parse this line
                const values = parseCSVLine(line);
                sampleRows.push(values);
            }
            
            // If we have sample data, try to infer column types
            if (sampleRows.length > 0) {
                // Try to find URL column by looking for http/https patterns
                if (fieldIndices.url === undefined) {
                    for (let i = 0; i < headers.length; i++) {
                        let urlCount = 0;
                        for (const row of sampleRows) {
                            if (i < row.length && isLikelyURL(row[i])) {
                                urlCount++;
                            }
                        }
                        
                        // If most rows have URL-like data in this column, it's likely the URL column
                        if (urlCount >= sampleRows.length * 0.7) {
                            fieldIndices.url = i;
                            console.log(`Inferred URL column at index ${i}`);
                            break;
                        }
                    }
                }
                
                // Try to find title column (usually the first non-URL column with text)
                if (fieldIndices.title === undefined) {
                    for (let i = 0; i < headers.length; i++) {
                        // Skip if this is already identified as another field
                        if (Object.values(fieldIndices).includes(i)) continue;
                        
                        let textCount = 0;
                        for (const row of sampleRows) {
                            if (i < row.length && row[i] && row[i].length > 0) {
                                textCount++;
                            }
                        }
                        
                        // If most rows have text in this column, it's likely the title column
                        if (textCount >= sampleRows.length * 0.7) {
                            fieldIndices.title = i;
                            console.log(`Inferred title column at index ${i}`);
                            break;
                        }
                    }
                }
                
                // For description, look for longer text fields
                if (fieldIndices.description === undefined) {
                    for (let i = 0; i < headers.length; i++) {
                        // Skip if this is already identified as another field
                        if (Object.values(fieldIndices).includes(i)) continue;
                        
                        let longTextCount = 0;
                        for (const row of sampleRows) {
                            if (i < row.length && row[i] && row[i].length > 20) {
                                longTextCount++;
                            }
                        }
                        
                        // If some rows have longer text in this column, it might be the description
                        if (longTextCount >= sampleRows.length * 0.3) {
                            fieldIndices.description = i;
                            console.log(`Inferred description column at index ${i}`);
                            break;
                        }
                    }
                }
            }
        }
        
        // If we still couldn't find the required columns, make a best guess
        if (fieldIndices.title === undefined && headers.length > 0) {
            // Assume first column is title if not already assigned
            if (!Object.values(fieldIndices).includes(0)) {
                fieldIndices.title = 0;
                console.log('Assuming first column is title');
            }
        }
        
        if (fieldIndices.url === undefined && headers.length > 1) {
            // Assume second column is URL if not already assigned
            if (!Object.values(fieldIndices).includes(1)) {
                fieldIndices.url = 1;
                console.log('Assuming second column is URL');
            }
        }
        
        // Final check - if we still don't have title and URL, we can't proceed
        if (fieldIndices.title === undefined || fieldIndices.url === undefined) {
            throw new Error('Could not identify title and URL columns in the CSV file. Please ensure your CSV contains this information.');
        }
        
        // Helper function to check if a string is likely a URL
        function isLikelyURL(str) {
            if (!str) return false;
            str = str.toLowerCase().trim();
            return str.startsWith('http://') || str.startsWith('https://') || 
                   str.includes('.com') || str.includes('.org') || str.includes('.net') ||
                   str.includes('www.') || str.includes('.co.') || str.includes('.io');
        }
        
        // Function to parse a CSV line, handling quoted fields
        function parseCSVLine(line) {
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            // Add the last value
            values.push(currentValue.trim());
            return values;
        }
        
        // Process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse this line
            const values = parseCSVLine(line);
            
            // Create standardized entry object using our field mappings
            const entry = {
                Title: '',
                URL: '',
                Category: '',
                Description: ''
            };
            
            // Map values to our standardized fields
            if (fieldIndices.title !== undefined && values[fieldIndices.title]) {
                entry.Title = cleanValue(values[fieldIndices.title]);
            }
            
            if (fieldIndices.url !== undefined && values[fieldIndices.url]) {
                entry.URL = cleanValue(values[fieldIndices.url]);
            }
            
            if (fieldIndices.category !== undefined && values[fieldIndices.category]) {
                entry.Category = cleanValue(values[fieldIndices.category]);
            }
            
            if (fieldIndices.description !== undefined && values[fieldIndices.description]) {
                entry.Description = cleanValue(values[fieldIndices.description]);
            }
            
            // Auto-detect category if not provided
            if (!entry.Category) {
                entry.Category = detectCategory(entry.URL, entry.Title);
            }
            
            // Add default description if not provided
            if (!entry.Description) {
                entry.Description = `Resource for ${entry.Title}`;
            }
            
            result.push(entry);
        }
        
        // Helper function to clean values
        function cleanValue(value) {
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            return value;
        }
        
        return result;
    }
    
    function detectCategory(url, title) {
        url = url ? url.toLowerCase() : '';
        title = title ? title.toLowerCase() : '';
        
        // Check for YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        }
        
        // Check for forums
        if (url.includes('forum') || url.includes('community') || url.includes('reddit.com') || 
            title.includes('forum') || title.includes('community') || title.includes('discussion')) {
            return 'forums';
        }
        
        // Check for stores
        if (url.includes('store') || url.includes('shop') || url.includes('buy') || 
            title.includes('store') || title.includes('shop') || title.includes('purchase')) {
            return 'stores';
        }
        
        // Check for manufacturers
        if (url.includes('manufacturer') || url.includes('company') || url.includes('brand') || 
            title.includes('manufacturer') || title.includes('company') || title.includes('brand')) {
            return 'manufacturers';
        }
        
        // Default to info
        return 'info';
    }
    
    function displayCsvPreview(data) {
        if (data.length === 0) {
            csvPreview.innerHTML = '<p>No data found in CSV file</p>';
            return;
        }
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        
        // Create table headers
        Object.keys(data[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table rows
        data.forEach(item => {
            const row = document.createElement('tr');
            
            Object.values(item).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        csvPreview.innerHTML = '';
        csvPreview.appendChild(table);
    }
    
    // Search functionality
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const resourceCards = document.querySelectorAll('.resource-card');
        
        resourceCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            const resourceCards = document.querySelectorAll('.resource-card');
            
            resourceCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'flex';
                } else if (card.classList.contains(filter)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Animation on scroll
    function fadeInCards() {
        const resourceCards = document.querySelectorAll('.resource-card');
        
        resourceCards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (cardTop < windowHeight - 100) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Initialize card animations
    function initializeCardAnimations() {
        const resourceCards = document.querySelectorAll('.resource-card');
        
        resourceCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
        
        // Run fade in
        fadeInCards();
    }
    
    // Run on scroll
    window.addEventListener('scroll', fadeInCards);
});
