import { PUBLIC_API_BASE_URL } from "../../lib/utils/constants";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

export default function articleCreatorLogic(initialState = {}) {
  return {
    article: {
      title: "",
      imageUrl: "",
      paragraphs: [],
    },
    newParagraph: "",
    showTextarea: false,
    editingIndex: null, // To track which paragraph is being edited
    editingText: "", // To hold the text of the paragraph being edited
    isEditingTitle: false,
    editingTitleText: "",
    
    // New state for image uploading
    uploading: false,
    uploadProgress: 0,

    // For Preview Page and Create Page state restoration
    init() {
      // On the preview page, always load from storage
      if (this.isPreview) {
        const previewData = localStorage.getItem("articlePreview");
        if (previewData) {
          this.article = JSON.parse(previewData);
        } else {
          this.article.title = "No preview data found.";
          this.article.paragraphs = [
            'Please go back to the creation page and click "Preview" again.',
          ];
        }
      } else {
        // On the create page, load if a draft exists
        const draftData = localStorage.getItem("articlePreview");
        if (draftData) {
          Object.assign(this.article, JSON.parse(draftData));
        }
      }
    },

    // --- Title editing methods ---
    editTitle() {
      this.isEditingTitle = true;
      this.editingTitleText = this.article.title;
    },
    saveTitle() {
      this.article.title = this.editingTitleText;
      this.isEditingTitle = false;
    },
    cancelEditTitle() {
      this.isEditingTitle = false;
    },

    // --- New Image Upload Method ---
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const storageRef = ref(storage, `articles/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress = progress;
        },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store('ui').showToast(`Upload failed: ${error.message}`, 'error');
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            this.article.imageUrl = downloadURL;
            this.uploading = false;
            window.Alpine.store('ui').showToast('Image uploaded successfully!');
          });
        }
      );
    },

    // For Create Page
    addParagraph() {
      this.showTextarea = true;
    },
    addNewParagraph() {
      if (this.newParagraph.trim() !== "") {
        this.article.paragraphs.push(this.newParagraph.trim());
        this.newParagraph = "";
        this.showTextarea = false;
      }
    },
    cancelParagraph() {
      this.newParagraph = "";
      this.showTextarea = false;
    },
    editParagraph(index) {
      this.editingIndex = index;
      this.editingText = this.article.paragraphs[index];
    },
    updateParagraph() {
      if (this.editingIndex !== null) {
        this.article.paragraphs[this.editingIndex] = this.editingText.trim();
        this.cancelEdit();
      }
    },
    cancelEdit() {
      this.editingIndex = null;
      this.editingText = "";
    },
    previewArticle() {
      localStorage.setItem("articlePreview", JSON.stringify(this.article));
      window.location.href = "/article/preview";
    },

    // For Preview Page
    returnToEdit() {
      window.location.href = "/article/create";
    },

    // Common save function
    async saveArticle() {
      // Ensure image is uploaded before saving
      if (!this.article.imageUrl) {
        window.Alpine.store('ui').showToast('Please upload a cover image before saving.', 'error');
        return;
      }

      try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/articles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: this.article.title,
            imageUrl: this.article.imageUrl,
            authorId: "HxpjsagLQxlUb2oCiM6h", // Using a test ID as planned
            content: this.article.paragraphs.map((p) => ({
              type: "paragraph",
              text: p,
            })),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          window.Alpine.store('ui').showToast('Article saved successfully!');
          localStorage.removeItem('articlePreview');
          window.location.href = `/article/${result.id}`;
        } else {
          const errorData = await response.json();
          window.Alpine.store('ui').showToast(`Error saving article: ${errorData.message}`, 'error');
        }
      } catch (error) {
        console.error('Failed to save article:', error);
        window.Alpine.store('ui').showToast('An error occurred while saving the article.', 'error');
      }
    },

    ...initialState,
  };
}
