// ========== PROFESSIONAL BATCH IMAGE CONVERTER ==========
const imageConverter = {
    files: [],
    convertedFiles: [],
    currentFileIndex: 0,
    isProcessing: false,
    originalImageData: null,
    currentPreviewFile: null,
    
    // File type mapping
    fileTypeMap: {
        'png': { mime: 'image/png', extensions: ['.png'], accept: '.png', icon: 'fa-file-image', color: 'text-primary' },
        'jpg': { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'], accept: '.jpg,.jpeg', icon: 'fa-file-image', color: 'text-danger' },
        'webp': { mime: 'image/webp', extensions: ['.webp'], accept: '.webp', icon: 'fa-file-image', color: 'text-success' },
        'svg': { mime: 'image/svg+xml', extensions: ['.svg'], accept: '.svg', icon: 'fa-file-code', color: 'text-warning' },
        'gif': { mime: 'image/gif', extensions: ['.gif'], accept: '.gif', icon: 'fa-file-video', color: 'text-info' },
        'avif': { mime: 'image/avif', extensions: ['.avif'], accept: '.avif', icon: 'fa-file-image', color: 'text-purple' },
        'tiff': { mime: 'image/tiff', extensions: ['.tiff', '.tif'], accept: '.tiff,.tif', icon: 'fa-file-image', color: 'text-secondary' },
        'heic': { mime: 'image/heic', extensions: ['.heic'], accept: '.heic', icon: 'fa-file-image', color: 'text-orange' },
        'heif': { mime: 'image/heif', extensions: ['.heif'], accept: '.heif', icon: 'fa-file-image', color: 'text-orange' }
    },
    
    // Initialize the converter
    init: function() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateFileTypeRestriction();
        this.updateUI();
        // utils.showNotification('🎨 Image Converter Ready! Select target format to begin.', 'success', 3000);
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // File input
        document.getElementById('browseBtn').addEventListener('click', () => {
            document.getElementById('imageFileInput').click();
        });
        
        document.getElementById('imageFileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // Convert From dropdown change
        document.getElementById('fromFormat').addEventListener('change', (e) => {
            this.updateFileTypeRestriction();
            this.clearQueue(); // Clear queue when format changes
            this.updateUI();
        });
        
        // Convert To dropdown change
        document.getElementById('toFormat').addEventListener('change', (e) => {
            this.updateConvertButtonState();
            this.updateUI();
        });
        
        // Settings toggle
        document.getElementById('settingsHeader').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });
        
        document.getElementById('settingsToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });
        
        // Quality slider
        const qualitySlider = document.getElementById('qualityRange');
        const qualityValue = document.getElementById('qualityValue');
        
        qualitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            qualityValue.textContent = `${value}%`;
            qualityValue.style.color = this.getQualityColor(value);
            this.updateUI();
        });
        
        // Convert button
        document.getElementById('convertBtn').addEventListener('click', () => {
            this.startBatchConversion();
        });
        
        // Clear queue button
        document.getElementById('clearQueueBtn').addEventListener('click', () => {
            this.clearQueue();
        });
        
        // Download all button
        document.getElementById('downloadAllBtn').addEventListener('click', () => {
            this.downloadAllConvertedFiles();
        });
        
        // Convert more button
        document.getElementById('convertMoreBtn').addEventListener('click', () => {
            this.resetConverter();
        });
        
        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelp();
        });
        
        // Close comparison modal
        document.getElementById('closeComparisonModal').addEventListener('click', () => {
            this.closeComparisonModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('comparisonModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('comparisonModal')) {
                this.closeComparisonModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('comparisonModal').classList.contains('active')) {
                this.closeComparisonModal();
            }
        });
        
        // Width and height inputs
        const widthInput = document.getElementById('widthInput');
        const heightInput = document.getElementById('heightInput');
        const aspectRatioToggle = document.getElementById('maintainAspectRatio');
        
        widthInput.addEventListener('input', (e) => {
            if (aspectRatioToggle.checked && this.originalImageData) {
                const newWidth = parseInt(e.target.value) || this.originalImageData.originalWidth;
                const newHeight = Math.round((newWidth / this.originalImageData.originalWidth) * this.originalImageData.originalHeight);
                heightInput.value = newHeight;
            }
            this.updateUI();
        });
        
        heightInput.addEventListener('input', (e) => {
            if (aspectRatioToggle.checked && this.originalImageData) {
                const newHeight = parseInt(e.target.value) || this.originalImageData.originalHeight;
                const newWidth = Math.round((newHeight / this.originalImageData.originalHeight) * this.originalImageData.originalWidth);
                widthInput.value = newWidth;
            }
            this.updateUI();
        });
        
        // Aspect ratio toggle
        aspectRatioToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                heightInput.disabled = true;
                if (widthInput.value && this.originalImageData) {
                    const newWidth = parseInt(widthInput.value);
                    const newHeight = Math.round((newWidth / this.originalImageData.originalWidth) * this.originalImageData.originalHeight);
                    heightInput.value = newHeight;
                }
            } else {
                heightInput.disabled = false;
            }
            this.updateUI();
        });
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
    },
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + O to browse files
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                document.getElementById('imageFileInput').click();
            }
            
            // Ctrl/Cmd + Enter to start conversion
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!document.getElementById('convertBtn').disabled) {
                    this.startBatchConversion();
                }
            }
            
            // Escape to clear queue
            if (e.key === 'Escape' && this.files.length > 0) {
                this.clearQueue();
            }
        });
    },
    
    // Setup drag and drop
    setupDragAndDrop: function() {
        const dropArea = document.getElementById('fileUploadArea');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('dragover');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('dragover');
            });
        });
        
        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFiles(Array.from(files));
            }
        });
    },
    
    // Update file type restriction based on selected format
    updateFileTypeRestriction: function() {
        const fromFormat = document.getElementById('fromFormat').value;
        const fileTypeInfo = this.fileTypeMap[fromFormat];
        const fileInput = document.getElementById('imageFileInput');
        const restrictionText = document.getElementById('fileTypeRestriction');
        
        if (fileTypeInfo) {
            fileInput.accept = fileTypeInfo.accept;
            const formatName = fromFormat.toUpperCase();
            restrictionText.textContent = `Supports ${formatName} files only`;
            
            // Update dropdown icon
            const selectIcon = document.querySelector('.custom-select-container .select-icon');
            if (selectIcon) {
                selectIcon.className = `fas ${fileTypeInfo.icon} select-icon ${fileTypeInfo.color}`;
            }
        }
    },
    
    // Handle file selection
    handleFileSelect: function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFiles(Array.from(files));
        }
    },
    
    // Handle multiple files with strict type validation
    handleFiles: function(files) {
        const fromFormat = document.getElementById('fromFormat').value;
        const fileTypeInfo = this.fileTypeMap[fromFormat];
        
        if (!fileTypeInfo) {
            utils.showNotification('Please select a valid source format', 'warning', 3000);
            return;
        }
        
        // Filter valid files
        const validFiles = files.filter(file => {
            // Check file extension
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            const isValidExtension = fileTypeInfo.extensions.includes(fileExt);
            
            // Check MIME type (fallback if extension check passes)
            const isValidMime = file.type === fileTypeInfo.mime || 
                               (file.type === '' && isValidExtension);
            
            if (!isValidExtension && !isValidMime) {
                utils.showNotification(`Skipped ${file.name}: Must be ${fromFormat.toUpperCase()} format`, 'warning', 3000);
                return false;
            }
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                utils.showNotification(`Skipped ${file.name}: File too large (max 5MB)`, 'warning', 3000);
                return false;
            }
            
            return true;
        });
        
        // Check total file count
        if (this.files.length + validFiles.length > 10) {
            utils.showNotification('Maximum 10 images allowed. Some files were skipped.', 'warning', 3000);
            validFiles.splice(10 - this.files.length);
        }
        
        // Add files to queue
        validFiles.forEach(file => {
            this.addFileToQueue(file);
        });
        
        // Update UI
        this.updateQueueDisplay();
        
        // Show success message
        if (validFiles.length > 0) {
            utils.showNotification(`Added ${validFiles.length} ${fromFormat.toUpperCase()} file(s) to queue`, 'success', 3000);
        }
        
        // Reset file input
        document.getElementById('imageFileInput').value = '';
        this.updateUI();
    },
    
    // Add file to queue
    addFileToQueue: function(file) {
        const fileId = Date.now() + Math.random();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // Create image to get original dimensions
            const img = new Image();
            img.onload = () => {
                const fileData = {
                    id: fileId,
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    originalDataUrl: e.target.result,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    status: 'pending',
                    converted: null
                };
                
                this.files.push(fileData);
                this.updateQueueDisplay();
                this.updateUI();
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    },
    
    // Update queue display
    updateQueueDisplay: function() {
        const queueItems = document.getElementById('queueItems');
        const fileQueue = document.getElementById('fileQueue');
        const fileCount = document.getElementById('fileCount');
        
        if (this.files.length === 0) {
            fileQueue.style.display = 'none';
            this.updateConvertButtonState();
            return;
        }
        
        fileQueue.style.display = 'block';
        fileCount.textContent = this.files.length;
        this.updateConvertButtonState();
        
        // Update queue items
        queueItems.innerHTML = '';
        this.files.forEach((fileData, index) => {
            const fileSize = this.formatFileSize(fileData.size);
            const fileType = this.getFileTypeName(fileData.type);
            
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <div class="queue-info">
                    <i class="fas fa-file-image queue-icon ${this.getFileTypeColor(fileData.type)}"></i>
                    <div class="queue-details">
                        <div class="queue-filename">${fileData.name}</div>
                        <div class="queue-filesize">
                            ${fileSize} • ${fileType} • ${fileData.originalWidth}×${fileData.originalHeight}px • 
                            <span class="badge badge-status ${fileData.status === 'pending' ? 'bg-warning' : fileData.status === 'converted' ? 'bg-success' : 'bg-danger'}">
                                ${fileData.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="queue-actions">
                    <button class="btn btn-sm btn-outline-danger queue-btn" onclick="imageConverter.removeFile(${index})" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            queueItems.appendChild(queueItem);
        });
    },
    
    // Update convert button state
    updateConvertButtonState: function() {
        const convertBtn = document.getElementById('convertBtn');
        const toFormat = document.getElementById('toFormat').value;
        
        if (this.files.length > 0 && toFormat) {
            convertBtn.disabled = false;
            convertBtn.classList.remove('btn-secondary');
            convertBtn.classList.add('btn-primary');
            convertBtn.innerHTML = `<i class="fas fa-sync-alt me-2"></i> Convert ${this.files.length} Image${this.files.length > 1 ? 's' : ''}`;
        } else {
            convertBtn.disabled = true;
            convertBtn.classList.remove('btn-primary');
            convertBtn.classList.add('btn-secondary');
            convertBtn.innerHTML = `<i class="fas fa-sync-alt me-2"></i> Select Files & Format`;
        }
    },
    
    // Preview original image
    previewOriginal: function(index) {
        if (index >= 0 && index < this.files.length) {
            const fileData = this.files[index];
            const previewContent = `
                <div class="text-center p-4">
                    <img src="${fileData.originalDataUrl}" alt="${fileData.name}" style="max-width: 100%; max-height: 400px; border-radius: 8px;" class="mb-3">
                    <h5>${fileData.name}</h5>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h6><i class="fas fa-info-circle"></i> File Info</h6>
                                    <div class="small">
                                        <div><strong>Size:</strong> ${this.formatFileSize(fileData.size)}</div>
                                        <div><strong>Type:</strong> ${this.getFileTypeName(fileData.type)}</div>
                                        <div><strong>Dimensions:</strong> ${fileData.originalWidth} × ${fileData.originalHeight} px</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h6><i class="fas fa-cog"></i> Status</h6>
                                    <div class="small">
                                        <div><strong>Status:</strong> <span class="badge ${fileData.status === 'pending' ? 'bg-warning' : fileData.status === 'converted' ? 'bg-success' : 'bg-danger'}">${fileData.status}</span></div>
                                        ${fileData.converted ? `
                                            <div><strong>Converted Format:</strong> ${document.getElementById('toFormat').value.toUpperCase()}</div>
                                            <div><strong>New Size:</strong> ${this.formatFileSize(fileData.converted.size)}</div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            utils.openPreviewDrawerWithContent(previewContent, `Preview: ${fileData.name}`);
        }
    },
    
    // Remove file from queue
    removeFile: function(index) {
        if (index >= 0 && index < this.files.length) {
            const fileName = this.files[index].name;
            this.files.splice(index, 1);
            this.updateQueueDisplay();
            this.updateUI();
            utils.showNotification(`Removed ${fileName} from queue`, 'info', 2000);
        }
    },
    
    // Clear queue
    clearQueue: function() {
        if (this.files.length > 0) {
            this.files = [];
            this.updateQueueDisplay();
            this.updateUI();
            utils.showNotification('Queue cleared', 'info', 2000);
        }
    },
    
    // Start batch conversion
    startBatchConversion: async function() {
        if (this.files.length === 0) {
            utils.showNotification('No images to convert', 'warning', 3000);
            return;
        }
        
        const toFormat = document.getElementById('toFormat').value;
        if (!toFormat) {
            utils.showNotification('Please select target format', 'warning', 3000);
            return;
        }
        
        if (this.isProcessing) {
            utils.showNotification('Conversion already in progress', 'warning', 3000);
            return;
        }
        
        this.isProcessing = true;
        this.convertedFiles = [];
        this.currentFileIndex = 0;
        
        // Show conversion progress
        document.getElementById('conversionProgress').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'none';
        document.getElementById('percentageAnimation').style.display = 'block';
        
        // Hide download section if visible
        document.getElementById('multiDownloadSection').style.display = 'none';
        
        // Start processing
        utils.showNotification(`🔄 Starting conversion of ${this.files.length} image${this.files.length > 1 ? 's' : ''}`, 'info', 2000);
        await this.processBatch();
    },
    
    // Process batch of files
    processBatch: async function() {
        if (this.currentFileIndex >= this.files.length) {
            // All files processed
            this.isProcessing = false;
            const successCount = this.convertedFiles.length;
            const failCount = this.files.length - successCount;
            
            let message = `Successfully converted ${successCount} image${successCount !== 1 ? 's' : ''}`;
            if (failCount > 0) {
                message += ` (${failCount} failed)`;
            }
            
            utils.showNotification(message, 'success', 3000);
            this.showMultiDownloadSection();
            return;
        }
        
        const fileData = this.files[this.currentFileIndex];
        
        // Update progress UI
        this.updateProgressUI(fileData.name, this.currentFileIndex + 1, this.files.length);
        
        try {
            // Convert the image
            const convertedData = await this.convertSingleImage(fileData);
            
            // Update file data
            fileData.status = 'converted';
            fileData.converted = {
                blob: convertedData.blob,
                url: convertedData.url,
                size: convertedData.blob.size,
                convertedWidth: convertedData.convertedWidth,
                convertedHeight: convertedData.convertedHeight,
                originalWidth: fileData.originalWidth,
                originalHeight: fileData.originalHeight,
                dataUrl: convertedData.dataUrl
            };
            
            // Add to converted files list
            this.convertedFiles.push({
                originalName: fileData.name,
                originalDataUrl: fileData.originalDataUrl,
                convertedBlob: convertedData.blob,
                convertedUrl: convertedData.url,
                convertedDataUrl: convertedData.dataUrl,
                originalSize: fileData.size,
                convertedSize: convertedData.blob.size,
                originalWidth: fileData.originalWidth,
                originalHeight: fileData.originalHeight,
                convertedWidth: convertedData.convertedWidth,
                convertedHeight: convertedData.convertedHeight,
                quality: convertedData.quality,
                format: convertedData.format
            });
            
            // Update queue display
            this.updateQueueDisplay();
            
            // Show progress notification for each file
            if (this.convertedFiles.length % 3 === 0 || this.currentFileIndex + 1 === this.files.length) {
                utils.showNotification(`Processed ${this.currentFileIndex + 1} of ${this.files.length} images`, 'info', 1500);
            }
            
        } catch (error) {
            fileData.status = 'failed';
            this.updateQueueDisplay();
            utils.showNotification(`Failed to convert ${fileData.name}`, 'error', 3000);
        }
        
        // Move to next file
        this.currentFileIndex++;
        
        // Process next file with delay for smooth animation
        setTimeout(() => {
            this.processBatch();
        }, 100);
    },
    
    // Convert single image
    convertSingleImage: function(fileData) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create image element from original data URL
                const img = new Image();
                
                img.onload = async () => {
                    try {
                        // Store original image data for aspect ratio
                        this.originalImageData = {
                            originalWidth: img.width,
                            originalHeight: img.height
                        };
                        
                        // Get conversion settings
                        const quality = parseInt(document.getElementById('qualityRange').value) / 100;
                        let width = document.getElementById('widthInput').value;
                        let height = document.getElementById('heightInput').value;
                        const toFormat = document.getElementById('toFormat').value;
                        const maintainAspect = document.getElementById('maintainAspectRatio').checked;
                        
                        // Calculate dimensions
                        let convertedWidth, convertedHeight;
                        if (!width && !height) {
                            convertedWidth = img.width;
                            convertedHeight = img.height;
                        } else if (width && !height) {
                            convertedWidth = parseInt(width);
                            if (maintainAspect) {
                                convertedHeight = Math.round((convertedWidth / img.width) * img.height);
                            } else {
                                convertedHeight = img.height;
                            }
                        } else if (!width && height) {
                            convertedHeight = parseInt(height);
                            if (maintainAspect) {
                                convertedWidth = Math.round((convertedHeight / img.height) * img.width);
                            } else {
                                convertedWidth = img.width;
                            }
                        } else {
                            convertedWidth = parseInt(width);
                            convertedHeight = parseInt(height);
                        }
                        
                        // Create canvas
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set canvas dimensions
                        canvas.width = convertedWidth;
                        canvas.height = convertedHeight;
                        
                        // Draw image with new dimensions
                        ctx.drawImage(img, 0, 0, convertedWidth, convertedHeight);
                        
                        // Convert to blob
                        let mimeType, blob;
                        
                        switch(toFormat) {
                            case 'jpg':
                            case 'jpeg':
                                mimeType = 'image/jpeg';
                                break;
                            case 'webp':
                                mimeType = 'image/webp';
                                break;
                            case 'png':
                                mimeType = 'image/png';
                                break;
                            case 'gif':
                                mimeType = 'image/gif';
                                break;
                            default:
                                mimeType = 'image/png';
                        }
                        
                        blob = await new Promise(resolve => {
                            canvas.toBlob(resolve, mimeType, quality);
                        });
                        
                        const url = URL.createObjectURL(blob);
                        
                        // Get data URL for preview
                        const dataUrl = canvas.toDataURL(mimeType, quality);
                        
                        resolve({
                            blob: blob,
                            url: url,
                            dataUrl: dataUrl,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            convertedWidth: convertedWidth,
                            convertedHeight: convertedHeight,
                            quality: parseInt(document.getElementById('qualityRange').value),
                            format: toFormat
                        });
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                
                img.src = fileData.originalDataUrl;
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Show comparison preview for a file
    showComparisonPreview: function(fileIndex) {
        if (fileIndex < 0 || fileIndex >= this.convertedFiles.length) {
            utils.showNotification('❌ File not found', 'error', 3000);
            return;
        }
        
        const file = this.convertedFiles[fileIndex];
        this.currentPreviewFile = file;
        
        // Calculate size reduction
        const sizeReduction = ((file.originalSize - file.convertedSize) / file.originalSize * 100).toFixed(1);
        const isBetter = sizeReduction > 0;
        
        // Get settings
        const quality = file.quality;
        const fromFormat = document.getElementById('fromFormat').value.toUpperCase();
        const toFormat = file.format.toUpperCase();
        const width = document.getElementById('widthInput').value || file.convertedWidth;
        const height = document.getElementById('heightInput').value || file.convertedHeight;
        
        // Build comparison modal content
        const comparisonContent = `
            <div class="comparison-layout">
                <div class="comparison-column">
                    <div class="comparison-image-container">
                        <div class="comparison-image-title">
                            <i class="fas fa-file-upload text-primary"></i>
                            Original Image (${fromFormat})
                        </div>
                        <div class="comparison-image-wrapper">
                            <img src="${file.originalDataUrl}" alt="Original" class="comparison-image">
                        </div>
                        <div class="comparison-details">
                            <div class="detail-grid">
                                <div class="detail-card">
                                    <div class="detail-card-title">File Size</div>
                                    <div class="detail-card-value">${this.formatFileSize(file.originalSize)}</div>
                                </div>
                                <div class="detail-card">
                                    <div class="detail-card-title">Dimensions</div>
                                    <div class="detail-card-value">${file.originalWidth} × ${file.originalHeight} px</div>
                                </div>
                                <div class="detail-card">
                                    <div class="detail-card-title">Format</div>
                                    <div class="detail-card-value">${fromFormat}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="comparison-column">
                    <div class="comparison-image-container">
                        <div class="comparison-image-title">
                            <i class="fas fa-file-download text-success"></i>
                            Converted Image (${toFormat})
                        </div>
                        <div class="comparison-image-wrapper">
                            <img src="${file.convertedDataUrl}" alt="Converted" class="comparison-image">
                        </div>
                        <div class="comparison-details">
                            <div class="detail-grid">
                                <div class="detail-card">
                                    <div class="detail-card-title">File Size</div>
                                    <div class="detail-card-value ${isBetter ? 'text-success' : 'text-danger'}">${this.formatFileSize(file.convertedSize)}</div>
                                </div>
                                <div class="detail-card">
                                    <div class="detail-card-title">Dimensions</div>
                                    <div class="detail-card-value">${file.convertedWidth} × ${file.convertedHeight} px</div>
                                </div>
                                <div class="detail-card">
                                    <div class="detail-card-title">Quality</div>
                                    <div class="detail-card-value">${quality}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Detailed comparison stats -->
            <div class="comparison-stats">
                <div class="stats-row">
                    <div class="stats-label">Size Reduction</div>
                    <div class="stats-value ${isBetter ? 'better' : 'worse'}">
                        ${isBetter ? '▼' : '▲'} ${Math.abs(sizeReduction)}% ${isBetter ? 'smaller' : 'larger'}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stats-label">Quality Setting</div>
                    <div class="stats-value">
                        ${quality}% ${quality >= 80 ? '🎯 (Excellent)' : quality >= 60 ? '👍 (Good)' : '📉 (Compressed)'}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stats-label">Resolution Change</div>
                    <div class="stats-value">
                        ${file.originalWidth}×${file.originalHeight} → ${file.convertedWidth}×${file.convertedHeight} px
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stats-label">Format Conversion</div>
                    <div class="stats-value">
                        ${fromFormat} → ${toFormat}
                    </div>
                </div>
            </div>
            
            <!-- Action buttons -->
            <div class="d-flex gap-2 mt-4">
                <button class="btn btn-success flex-grow-1" onclick="imageConverter.downloadSingleFile(${fileIndex})">
                    <i class="fas fa-download me-2"></i> Download This File
                </button>
                <button class="btn btn-outline-secondary" onclick="imageConverter.closeComparisonModal()">
                    <i class="fas fa-times me-2"></i> Close
                </button>
            </div>
        `;
        
        // Update modal content
        document.getElementById('comparisonModalBody').innerHTML = comparisonContent;
        
        // Show modal
        document.getElementById('comparisonModal').classList.add('active');
    },
    
    // Close comparison modal
    closeComparisonModal: function() {
        document.getElementById('comparisonModal').classList.remove('active');
        this.currentPreviewFile = null;
    },
    
    // Update progress UI
    updateProgressUI: function(fileName, current, total) {
        document.getElementById('currentFileName').textContent = `${fileName} (${current}/${total})`;
        const progressPercent = Math.round((current / total) * 100);
        document.getElementById('currentProgress').textContent = `${progressPercent}%`;
        document.getElementById('conversionProgressBar').style.width = `${progressPercent}%`;
        
        // Update percentage animation
        document.getElementById('percentageValue').textContent = `${progressPercent}%`;
        document.getElementById('percentageCircle').style.background = 
            `conic-gradient(#007bff ${progressPercent * 3.6}deg, transparent 0deg)`;
        
        // Estimate time
        const remaining = total - current;
        const estimatedTime = remaining * 0.3; // 0.3 seconds per image
        document.getElementById('progressTime').textContent = 
            `Estimated time: ${estimatedTime.toFixed(1)} seconds remaining`;
    },
    
    // Show multi-file download section
    showMultiDownloadSection: function() {
        // Hide progress elements
        document.getElementById('conversionProgress').style.display = 'none';
        document.getElementById('percentageAnimation').style.display = 'none';
        
        // Calculate totals
        let totalOriginalSize = 0;
        let totalConvertedSize = 0;
        let successfulConversions = 0;
        
        this.convertedFiles.forEach(file => {
            totalOriginalSize += file.originalSize;
            totalConvertedSize += file.convertedSize;
            successfulConversions++;
        });
        
        // Update stats
        document.getElementById('totalFilesConverted').textContent = successfulConversions;
        document.getElementById('totalOriginalSize').textContent = this.formatFileSize(totalOriginalSize);
        document.getElementById('totalConvertedSize').textContent = this.formatFileSize(totalConvertedSize);
        
        if (totalOriginalSize > 0) {
            const sizeReduction = ((totalOriginalSize - totalConvertedSize) / totalOriginalSize * 100).toFixed(1);
            document.getElementById('totalSizeReduction').textContent = `${sizeReduction}%`;
        }
        
        // Show converted files list
        const convertedFilesList = document.getElementById('convertedFilesList');
        convertedFilesList.innerHTML = '';
        
        this.convertedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'converted-file-item';
            
            const sizeReduction = ((file.originalSize - file.convertedSize) / file.originalSize * 100).toFixed(1);
            const isBetter = sizeReduction > 0;
            
            fileItem.innerHTML = `
                <div class="converted-file-info">
                    <i class="fas fa-check-circle converted-file-icon text-success"></i>
                    <div class="converted-file-details">
                        <div class="converted-file-name">
                            ${file.originalName}
                            <span class="badge ${isBetter ? 'bg-success' : 'bg-warning'} ms-2">
                                ${isBetter ? '▼' : '▲'} ${Math.abs(sizeReduction)}%
                            </span>
                        </div>
                        <div class="converted-file-stats">
                            <span><i class="fas fa-weight-hanging"></i> ${this.formatFileSize(file.originalSize)} → ${this.formatFileSize(file.convertedSize)}</span>
                            <span>•</span>
                            <span><i class="fas fa-expand-alt"></i> ${file.originalWidth}×${file.originalHeight} → ${file.convertedWidth}×${file.convertedHeight} px</span>
                            <span>•</span>
                            <span><i class="fas fa-cog"></i> ${file.format.toUpperCase()} • ${file.quality}% Q</span>
                        </div>
                    </div>
                </div>
                <div class="converted-file-actions">
                    <button class="preview-btn" onclick="imageConverter.showComparisonPreview(${index})">
                        <i class="fas fa-eye me-1"></i> Preview
                    </button>
                    <button class="download-file-btn" onclick="imageConverter.downloadSingleFile(${index})">
                        <i class="fas fa-download me-1"></i> Download
                    </button>
                </div>
            `;
            convertedFilesList.appendChild(fileItem);
        });
        
        // Show download section
        document.getElementById('multiDownloadSection').style.display = 'block';
        
        // Show action buttons again
        document.getElementById('actionButtons').style.display = 'flex';
    },
    
    // Download single converted file
    downloadSingleFile: function(index) {
        if (index >= 0 && index < this.convertedFiles.length) {
            const file = this.convertedFiles[index];
            const toFormat = document.getElementById('toFormat').value;
            const fileName = file.originalName.replace(/\.[^/.]+$/, "") + '.' + toFormat;
            
            const link = document.createElement('a');
            link.href = file.convertedUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            utils.showNotification(`Downloaded ${fileName}`, 'success', 2000);
        }
    },
    
    // Download all converted files as ZIP
    downloadAllConvertedFiles: async function() {
        if (this.convertedFiles.length === 0) {
            utils.showNotification('No files to download', 'warning', 3000);
            return;
        }
        
        try {
            utils.showNotification('Creating ZIP file...', 'info', 2000);
            
            // Create zip file using JSZip
            if (typeof JSZip === 'undefined') {
                // Load JSZip dynamically
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            }
            
            const zip = new JSZip();
            const toFormat = document.getElementById('toFormat').value;
            
            // Add each file to zip
            this.convertedFiles.forEach((file, index) => {
                const fileName = file.originalName.replace(/\.[^/.]+$/, "") + '.' + toFormat;
                zip.file(fileName, file.convertedBlob);
            });
            
            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            
            // Download zip
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `converted-images-${new Date().getTime()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => {
                URL.revokeObjectURL(zipUrl);
            }, 1000);
            
            utils.showNotification(`Downloaded ${this.convertedFiles.length} files as ZIP`, 'success', 3000);
            
        } catch (error) {
            utils.showNotification('Failed to create ZIP file. Downloading files individually...', 'warning', 3000);
            
            // Fallback: download files individually
            this.downloadFilesIndividually();
        }
    },
    
    // Download files individually (fallback)
    downloadFilesIndividually: function() {
        utils.showNotification('Downloading files individually...', 'info', 2000);
        
        this.convertedFiles.forEach((file, index) => {
            setTimeout(() => {
                this.downloadSingleFile(index);
            }, index * 300); // Stagger downloads
        });
    },
    
    // Load external script
    loadScript: function(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Reset converter
    resetConverter: function() {
        // Revoke object URLs
        this.convertedFiles.forEach(file => {
            if (file.convertedUrl) {
                URL.revokeObjectURL(file.convertedUrl);
            }
        });
        
        // Clear arrays
        this.files = [];
        this.convertedFiles = [];
        
        // Show action buttons
        document.getElementById('actionButtons').style.display = 'flex';
        
        // Hide other sections
        document.getElementById('multiDownloadSection').style.display = 'none';
        document.getElementById('conversionProgress').style.display = 'none';
        document.getElementById('percentageAnimation').style.display = 'none';
        
        // Reset form
        document.getElementById('toFormat').value = '';
        document.getElementById('widthInput').value = '';
        document.getElementById('heightInput').value = '';
        document.getElementById('qualityRange').value = '100';
        document.getElementById('qualityValue').textContent = '100%';
        document.getElementById('qualityValue').style.color = this.getQualityColor(100);
        document.getElementById('maintainAspectRatio').checked = true;
        document.getElementById('heightInput').disabled = true;
        
        // Update UI
        this.updateQueueDisplay();
        this.updateConvertButtonState();
        this.updateUI();
        
        utils.showNotification('Ready for new conversion', 'info', 2000);
    },
    
    // Toggle settings
    toggleSettings: function() {
        const settingsContent = document.getElementById('settingsContent');
        const settingsToggle = document.getElementById('settingsToggle');
        
        if (settingsContent.style.display === 'none' || !settingsContent.style.display) {
            settingsContent.style.display = 'block';
            settingsToggle.innerHTML = '<i class="fas fa-chevron-up me-1"></i> Hide Settings';
        } else {
            settingsContent.style.display = 'none';
            settingsToggle.innerHTML = '<i class="fas fa-chevron-down me-1"></i> Show Settings';
        }
    },
    
    // Update UI state
    updateUI: function() {
        // Update file count badge
        const fileCount = this.files.length;
        document.getElementById('fileCount').textContent = fileCount;
        
        // Update button states
        const hasFiles = fileCount > 0;
        document.getElementById('clearQueueBtn').disabled = !hasFiles;
        document.getElementById('convertBtn').disabled = !hasFiles || !document.getElementById('toFormat').value;
        
        // Update upload area text
        const uploadArea = document.getElementById('fileUploadArea');
        const fromFormat = document.getElementById('fromFormat').value.toUpperCase();
        document.getElementById('fileTypeRestriction').textContent = `Supports ${fromFormat} files only`;
        
        // Update status indicators
        if (this.isProcessing) {
            document.getElementById('actionButtons').style.display = 'none';
            document.getElementById('conversionProgress').style.display = 'block';
        }
        
        // Update dimensions if original image data exists
        if (this.originalImageData) {
            const widthInput = document.getElementById('widthInput');
            const heightInput = document.getElementById('heightInput');
            
            if (!widthInput.value) {
                widthInput.value = this.originalImageData.originalWidth;
            }
            if (!heightInput.value) {
                heightInput.value = this.originalImageData.originalHeight;
            }
        }
    },
    
    // Get file type color
    getFileTypeColor: function(mimeType) {
        const colors = {
            'image/png': 'text-primary',
            'image/jpeg': 'text-danger',
            'image/jpg': 'text-danger',
            'image/webp': 'text-success',
            'image/svg+xml': 'text-warning',
            'image/gif': 'text-info',
            'image/avif': 'text-purple',
            'image/tiff': 'text-secondary',
            'image/heic': 'text-orange',
            'image/heif': 'text-orange'
        };
        
        return colors[mimeType] || 'text-light';
    },
    
    // Get quality color
    getQualityColor: function(value) {
        if (value >= 80) return '#2ecc71'; // Green
        if (value >= 60) return '#f39c12'; // Orange
        if (value >= 40) return '#e74c3c'; // Red
        return '#95a5a6'; // Gray
    },
    
    // Format file size
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Get file type name
    getFileTypeName: function(mimeType) {
        const types = {
            'image/png': 'PNG',
            'image/jpeg': 'JPG',
            'image/jpg': 'JPG',
            'image/webp': 'WEBP',
            'image/svg+xml': 'SVG',
            'image/gif': 'GIF',
            'image/avif': 'AVIF',
            'image/tiff': 'TIFF',
            'image/heic': 'HEIC',
            'image/heif': 'HEIF'
        };
        
        return types[mimeType] || 'Unknown';
    },
    
    // Show help
    showHelp: function() {
        const helpContent = `
            <div class="p-3">
                <h4><i class="fas fa-question-circle text-primary me-2"></i>Image Converter Help</h4>
                <div class="mt-3">
                    <h6><i class="fas fa-play-circle text-success me-2"></i> Quick Start:</h6>
                    <ol class="mb-3">
                        <li>Select source format (Convert From)</li>
                        <li>Upload matching images (drag & drop or click)</li>
                        <li>Choose target format (Convert To)</li>
                        <li>Adjust settings if needed</li>
                        <li>Click "Convert All Images"</li>
                        <li>Preview comparisons before downloading</li>
                    </ol>
                    
                    <h6><i class="fas fa-keyboard me-2"></i> Keyboard Shortcuts:</h6>
                    <ul class="mb-3">
                        <li><kbd>Ctrl/Cmd + O</kbd> - Browse files</li>
                        <li><kbd>Ctrl/Cmd + Enter</kbd> - Start conversion</li>
                        <li><kbd>Escape</kbd> - Clear queue</li>
                        <li><kbd>P</kbd> - Preview selected file</li>
                    </ul>
                    
                    <h6><i class="fas fa-lightbulb me-2"></i> Tips:</h6>
                    <ul>
                        <li>Drag & drop multiple files at once</li>
                        <li>Use WEBP format for best compression</li>
                        <li>Quality 80-90% is usually optimal</li>
                        <li>Download as ZIP for multiple files</li>
                        <li>Files are processed locally - no uploads</li>
                    </ul>
                </div>
                
                <div class="mt-4 border-top pt-3">
                    <small>
                        <i class="fas fa-shield-alt me-1"></i> Your images are processed locally and never leave your computer.
                    </small>
                </div>
            </div>
        `;
        
        utils.openPreviewDrawerWithContent(helpContent, 'Image Converter Help');
    }
};

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the converter
    imageConverter.init();
    
    // Add some sample images for demo
    // setTimeout(() => {
    //     if (imageConverter.files.length === 0) {
    //         // utils.showNotification('👆 Select "Convert To" format and upload images to start', 'info', 4000);
    //     }
    // }, 3000);
});

// Make converter globally accessible
window.imageConverter = imageConverter;