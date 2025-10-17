// ========== COMMON UTILITY FUNCTIONS ==========
const utils = {
    showFileInfo(fileInput, fileInfoId) {
        const file = fileInput.files[0];
        if (!file) return;
        const fileInfo = document.getElementById(fileInfoId);
        const fileSize = (file.size / 1024).toFixed(2);
        fileInfo.innerHTML = `<div class="alert alert-info p-2"><div class="d-flex justify-content-between"><span><strong>Name:</strong> ${file.name}</span><span><strong>Size:</strong> ${fileSize} KB</span></div><div><strong>Type:</strong> ${file.type || "Unknown"}</div></div>`;
        fileInfo.style.display = "block";
    },

    showProgress(progressId, progressTextId, message = "Processing...") {
        const progressContainer = document.getElementById(progressId);
        const progressText = document.getElementById(progressTextId);
        progressContainer.style.display = "block";
        progressText.textContent = message;
        const progressBar = progressContainer.querySelector(".progress-bar");
        progressBar.style.width = "0%";
        let progress = 0;
        const interval = setInterval(() => {
            if (progress >= 90) clearInterval(interval);
            progress += 5;
            progressBar.style.width = progress + "%";
        }, 100);
        return interval;
    },

    hideProgress(progressId, interval) {
        clearInterval(interval);
        const progressContainer = document.getElementById(progressId);
        const progressBar = progressContainer.querySelector(".progress-bar");
        progressBar.style.width = "100%";
        setTimeout(() => { progressContainer.style.display = "none"; }, 500);
    },

    showNotification(message, type = "info") {
        document.querySelectorAll('.notification').forEach(el => el.remove());
        const alertClass = type === "error" ? "danger" : type;
        const icon = type === "success" ? "fa-check" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle";
        const notification = document.createElement("div");
        notification.className = `notification alert alert-${alertClass} fade show`;
        notification.innerHTML = `<div class="d-flex justify-content-between align-items-center"><span><i class="fas ${icon} me-2"></i>${message}</span><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.value || element.textContent;
        if (text?.trim()) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification("Code copied to clipboard!", "success");
            }).catch(() => {
                this.showNotification("Failed to copy text. Please try again.", "error");
            });
        } else {
            this.showNotification("No content to copy!", "warning");
        }
    }
};