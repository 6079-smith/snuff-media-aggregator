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
    
    // Tab Navigation Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Internet Search Elements
    const internetSearchInput = document.getElementById('internetSearchInput');
    const internetSearchButton = document.getElementById('internetSearchButton');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const searchResultsContainer = document.getElementById('searchResults');
    const saveAllResultsButton = document.getElementById('saveAllResultsButton');
    const exportResultsButton = document.getElementById('exportResultsButton');
    const searchActions = document.querySelector('.search-actions');
    
    // Manual Resource Form Elements
    const resourceTitleInput = document.getElementById('resourceTitle');
    const resourceUrlInput = document.getElementById('resourceUrl');
    const resourceCategorySelect = document.getElementById('resourceCategory');
    const resourceDescriptionInput = document.getElementById('resourceDescription');
    const addResourceButton = document.getElementById('addResourceButton');
    
    // API endpoints
    const API_URL = '/api';
    const ENDPOINTS = {
        GET_RESOURCES: `${API_URL}/resources`,
        ADD_RESOURCE: `${API_URL}/resources`,
        DELETE_RESOURCE: `${API_URL}/resources`
    };
    
    // Load resources from API
    loadResources();
    
    // Clear All Resources functionality
    const clearAllResourcesButton = document.getElementById('clearAllResourcesButton');
    clearAllResourcesButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all resources? This action cannot be undone.')) {
            // Clear localStorage
            localStorage.removeItem('snuffResources');
            
            // Clear the resources container
            resourcesContainer.innerHTML = '<div class="loading-message">No resources found. Upload some using CSV!</div>';
            
            // Show confirmation message
            const confirmationMessage = document.createElement('div');
            confirmationMessage.className = 'success-message';
            confirmationMessage.textContent = 'All resources have been cleared!';
            resourcesContainer.prepend(confirmationMessage);
            
            // Remove confirmation message after 3 seconds
            setTimeout(() => {
                if (confirmationMessage.parentNode === resourcesContainer) {
                    resourcesContainer.removeChild(confirmationMessage);
                }
            }, 3000);
        }
    });
    
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
    
    // Clear resources search functionality
    const clearResourcesButton = document.getElementById('clearResourcesButton');
    clearResourcesButton.addEventListener('click', function() {
        // Clear the search input
        searchInput.value = '';
        
        // Reset filter buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        
        // Show all resources
        const resourceCards = document.querySelectorAll('.resource-card');
        resourceCards.forEach(card => {
            card.style.display = 'flex';
        });
        
        // Focus on the search input
        searchInput.focus();
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
    
    // Tab Navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Curated Resource Sets Functionality
    let searchResultsData = [];
    
    // Pre-defined resource sets
    const resourceSets = {
        popular: [
            {
                title: "Mr Snuff",
                description: "One of the world's largest online snuff stores with a huge range of varieties from across the globe.",
                url: "https://www.mrsnuff.com/",
                category: "stores"
            },
            {
                title: "Toque Snuff",
                description: "Premium UK-made snuff tobacco in a wide variety of flavors and strengths.",
                url: "https://www.toquesnuff.com/",
                category: "stores"
            },
            {
                title: "Reddit - r/nasalsnuff",
                description: "Reddit community dedicated to nasal snuff and snuff-related discussions.",
                url: "https://www.reddit.com/r/nasalsnuff/",
                category: "forums"
            },
            {
                title: "Snuff House Forum",
                description: "Active forum for snuff enthusiasts with reviews, discussions, and trading.",
                url: "https://snuffhouse.com/",
                category: "forums"
            },
            {
                title: "Simply Snuff!",
                description: "Regular snuff reviews posted on Wednesdays and Sundays with an active community.",
                url: "https://www.youtube.com/channel/UCkDy-VX2CUkARohIR8nWp-g",
                category: "youtube"
            },
            {
                title: "McChrystal's Snuff",
                description: "Original sniffing tobacco established in 1926 offering various snuff products.",
                url: "https://mcchrystals.co.uk/",
                category: "manufacturers"
            },
            {
                title: "Snuff.Me.UK",
                description: "Comprehensive information site about snuff tobacco, its history, and how to use it.",
                url: "https://snuff.me.uk/",
                category: "info"
            }
        ],
        international: [
            {
                title: "Bernard Schnupftabak",
                description: "German manufacturer of traditional Bavarian-style snuff tobacco since 1733.",
                url: "https://bernard.de/",
                category: "manufacturers"
            },
            {
                title: "Pöschl Tabak",
                description: "German tobacco company known for their Ozona and Gawith Apricot snuffs.",
                url: "https://www.poeschl-tobacco.com/",
                category: "manufacturers"
            },
            {
                title: "Rosinski Schnupftabak",
                description: "Artisanal German snuff maker producing small-batch, high-quality snuffs.",
                url: "https://www.rosinski-schnupf.de/",
                category: "manufacturers"
            },
            {
                title: "Mullins & Westley Ltd",
                description: "UK-based store specializing in traditional English snuffs.",
                url: "https://www.mullinsandwestley.co.uk/",
                category: "stores"
            },
            {
                title: "Snuffstore.co.uk",
                description: "UK online store with a wide selection of British and international snuffs.",
                url: "https://www.snuffstore.co.uk/",
                category: "stores"
            },
            {
                title: "Snuff.eu",
                description: "European snuff store shipping worldwide with extensive selection.",
                url: "https://snuff.eu/",
                category: "stores"
            }
        ],
        reviews: [
            {
                title: "Snuff Reviews",
                description: "Dedicated blog with hundreds of detailed snuff tobacco reviews.",
                url: "https://snuffreviews.com/",
                category: "info"
            },
            {
                title: "Snuff Taker's Ephemeris",
                description: "Online magazine dedicated to snuff tobacco culture, history, and reviews.",
                url: "https://snuffhouse.com/discussion/",
                category: "info"
            },
            {
                title: "Snuff Notes Blog",
                description: "Personal blog with tasting notes and reviews of various snuff tobaccos.",
                url: "https://snuffnotes.blogspot.com/",
                category: "info"
            },
            {
                title: "SnuffSense YouTube Channel",
                description: "Video reviews of snuff tobacco varieties with detailed sensory descriptions.",
                url: "https://www.youtube.com/user/SnuffSense",
                category: "youtube"
            },
            {
                title: "Snuff Reviews Podcast",
                description: "Audio podcast featuring reviews and discussions about snuff tobacco.",
                url: "https://snuffcast.podbean.com/",
                category: "info"
            }
        ],
        communities: [
            {
                title: "Snuff House Forum",
                description: "The largest online community dedicated to snuff tobacco enthusiasts.",
                url: "https://snuffhouse.com/",
                category: "forums"
            },
            {
                title: "Reddit - r/nasalsnuff",
                description: "Reddit community dedicated to nasal snuff and snuff-related discussions.",
                url: "https://www.reddit.com/r/nasalsnuff/",
                category: "forums"
            },
            {
                title: "Snuff Takers' Discord",
                description: "Discord server for real-time chat about snuff tobacco.",
                url: "https://discord.gg/snufftobacco",
                category: "forums"
            },
            {
                title: "Facebook - Snuff Takers Group",
                description: "Facebook group for snuff enthusiasts to share experiences and recommendations.",
                url: "https://www.facebook.com/groups/snufftakers/",
                category: "forums"
            },
            {
                title: "Snuff Tobacco Meetups",
                description: "Information about in-person meetups and events for snuff tobacco enthusiasts.",
                url: "https://snuffmeetups.com/",
                category: "forums"
            }
        ]
    };
    
    // Resource Set Selection
    const resourceSetButtons = document.querySelectorAll('.resource-set-btn');
    resourceSetButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            resourceSetButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Get the selected resource set
            const setName = this.getAttribute('data-set');
            
            // Get active category
            const activeCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
            
            // Display resources from the selected set
            displayResourceSet(setName, activeCategory);
        });
    });
    
    // Display initial resource set (popular)
    setTimeout(() => {
        displayResourceSet('popular', 'all');
    }, 500);
    
    function displayResourceSet(setName, category) {
        // Get resources from the selected set
        const resources = resourceSets[setName] || [];
        
        // Filter by category if needed
        const filteredResources = category === 'all' 
            ? resources 
            : resources.filter(resource => resource.category === category);
        
        // Store the results for later use
        searchResultsData = filteredResources;
        
        // Display the resources
        displaySearchResults(filteredResources);
        
        // Show action buttons if we have results
        if (filteredResources.length > 0) {
            searchActions.style.display = 'flex';
        } else {
            searchActions.style.display = 'none';
        }
    }
    
    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="search-prompt">No results found. Try different search terms or options.</div>';
            return;
        }
        
        let html = '';
        
        results.forEach((result, index) => {
            html += `
                <div class="search-result-item">
                    <input type="checkbox" class="search-result-checkbox" data-index="${index}" checked>
                    <div class="search-result-content">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-description">${result.description}</div>
                        <div class="search-result-url">${result.url}</div>
                        <div class="search-result-category">${getCategoryLabel(result.category)}</div>
                    </div>
                </div>
            `;
        });
        
        searchResultsContainer.innerHTML = html;
    }
    
    function getCategoryLabel(category) {
        const labels = {
            'forums': 'Forums',
            'youtube': 'YouTube',
            'stores': 'Stores',
            'manufacturers': 'Manufacturers',
            'info': 'Information'
        };
        
        return labels[category] || 'Other';
    }
    
    // Category filter for internet search
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Save all search results to resources
    saveAllResultsButton.addEventListener('click', function() {
        const checkedResults = getCheckedSearchResults();
        
        if (checkedResults.length === 0) {
            alert('Please select at least one result to save');
            return;
        }
        
        // Show progress indicator
        searchResultsContainer.innerHTML = '<div class="search-loading">Saving selected resources...</div>';
        
        // Process each result with a delay to show progress
        processSearchResultsWithProgress(checkedResults);
    });
    
    function getCheckedSearchResults() {
        const checkboxes = document.querySelectorAll('.search-result-checkbox:checked');
        const checkedResults = [];
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.getAttribute('data-index'));
            if (!isNaN(index) && searchResultsData[index]) {
                checkedResults.push(searchResultsData[index]);
            }
        });
        
        return checkedResults;
    }
    
    function processSearchResultsWithProgress(results) {
        let processed = 0;
        const total = results.length;
        
        function processNextResult(index) {
            if (index >= total) {
                // All items processed
                searchResultsContainer.innerHTML = `<div class="search-prompt success">Successfully saved ${total} resources!</div>`;
                searchActions.style.display = 'none';
                
                // Reload resources to show the newly added ones
                loadResources();
                
                // Switch to resources tab after a delay
                setTimeout(() => {
                    document.querySelector('.tab-btn[data-tab="resources-tab"]').click();
                }, 2000);
                
                return;
            }
            
            // Update progress display
            const percent = Math.round((index / total) * 100);
            searchResultsContainer.innerHTML = `
                <div class="search-loading">
                    Saving resource ${index + 1} of ${total}...
                    <div class="upload-progress-bar-container">
                        <div class="upload-progress-bar" style="width: ${percent}%"></div>
                    </div>
                    <div class="upload-progress-status">${percent}%</div>
                </div>
            `;
            
            // Save the current result
            const item = results[index];
            saveResource({
                title: item.title,
                description: item.description,
                url: item.url,
                category: item.category
            });
            
            // Process next item after a delay
            setTimeout(() => {
                processNextResult(index + 1);
            }, 500);
        }
        
        // Start processing
        processNextResult(0);
    }
    
    // Export search results as CSV
    exportResultsButton.addEventListener('click', function() {
        const checkedResults = getCheckedSearchResults();
        
        if (checkedResults.length === 0) {
            alert('Please select at least one result to export');
            return;
        }
        
        // Convert results to CSV
        const csv = convertToCSV(checkedResults);
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'snuff_resources.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    function convertToCSV(results) {
        const header = 'Title,Description,URL,Category\n';
        const rows = results.map(item => {
            // Properly escape fields for CSV
            const title = item.title.replace(/"/g, '""');
            const description = item.description.replace(/"/g, '""');
            const url = item.url.replace(/"/g, '""');
            const category = item.category;
            
            return `"${title}","${description}","${url}","${category}"`;
        });
        
        return header + rows.join('\n');
    }
    
    // Manual resource addition
    addResourceButton.addEventListener('click', function() {
        const title = resourceTitleInput.value.trim();
        const url = resourceUrlInput.value.trim();
        const category = resourceCategorySelect.value;
        const description = resourceDescriptionInput.value.trim();
        
        if (!title || !url) {
            alert('Please enter at least a title and URL');
            return;
        }
        
        // Create and save the resource
        const resource = {
            title: title,
            description: description || `User-contributed ${category} resource`,
            url: url,
            category: category
        };
        
        saveResource(resource);
        
        // Show success message
        const formContainer = document.querySelector('.manual-resource-form');
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Resource added successfully!';
        formContainer.appendChild(successMessage);
        
        // Clear form
        resourceTitleInput.value = '';
        resourceUrlInput.value = '';
        resourceDescriptionInput.value = '';
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            formContainer.removeChild(successMessage);
        }, 3000);
        
        // Reload resources to show the newly added one
        loadResources();
        
        // Switch to resources tab after a delay
        setTimeout(() => {
            document.querySelector('.tab-btn[data-tab="resources-tab"]').click();
        }, 2000);
    });
});
