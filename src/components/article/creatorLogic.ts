import { articlesApi } from "@/lib/api/api";
import { app } from "../../lib/firebase/client";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

// Helper to create a new block object
const createBlock = (type, data) => ({ type, ...data });

export default function articleCreatorLogic(initialState = {}) {
  return {
    article: {
      title: "",
      imageUrl: "",
      imageCaption: "", // <-- Added caption for the main image
      // --- REFACTORED: from 'paragraphs' to 'contentBlocks' ---
      contentBlocks: [], 
      tags: [],
      category: "", // <-- Added category
    },

    // --- State for managing the block creation UI ---
    showBlockOptions: false,
    
    // --- State for editing a specific block ---
    editingIndex: null,
    editingBlock: null, // Will hold a copy of the block being edited

    isEditingTitle: false,
    editingTitleText: "",
    
    // --- State for editing the main image caption ---
    isEditingCaption: false,
    editingCaptionText: "",

    uploading: false,
    uploadProgress: 0,

    init() {
      // The `isPreview` flag is passed from the page component
      if (this.isPreview) {
        // On the preview page, always load from storage, replacing the initial object
        const previewData = localStorage.getItem("articlePreview");
        if (previewData) {
          this.article = JSON.parse(previewData);
        }
      } else {
        // On the create page, merge if a draft exists to preserve the initial structure
        const draftData = localStorage.getItem("articlePreview");
        if (draftData) {
          const parsedData = JSON.parse(draftData);
          // Ensure contentBlocks is always an array, even in older drafts
          parsedData.contentBlocks = parsedData.contentBlocks || [];
          Object.assign(this.article, parsedData);
        }
      }
    },

    // --- Title editing methods (unchanged) ---
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

    // --- Caption editing methods ---
    editCaption() {
      this.isEditingCaption = true;
      this.editingCaptionText = this.article.imageCaption;
    },
    saveCaption() {
      this.article.imageCaption = this.editingCaptionText;
      this.isEditingCaption = false;
    },
    cancelEditCaption() {
      this.isEditingCaption = false;
    },

    // --- Image Upload Method ---
    handleImageUpload(event, isCover = true, blockIndex = null) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploading = true;
      this.uploadProgress = 0;

      const storageRef = ref(storage, `articles/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => { this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100; },
        (error) => {
          console.error("Upload failed:", error);
          window.Alpine.store('ui').showToast(`Upload failed: ${error.message}`, 'error');
          this.uploading = false;
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            if (isCover) {
              this.article.imageUrl = downloadURL;
            } else if (blockIndex !== null && this.editingBlock && this.editingBlock.type === 'image') {
              // Update the URL for the specific image block being edited
              this.editingBlock.url = downloadURL;
            }
            this.uploading = false;
            window.Alpine.store('ui').showToast('Image uploaded successfully!');
          });
        }
      );
    },

    // --- REFACTORED: Block management methods ---
    
    // Opens the menu to select a new block type
    openBlockSelector() {
        this.showBlockOptions = true;
    },

    // Adds a new block of a specific type and opens it for editing
    addBlock(type) {
        let newBlockData = {};
        // Set default data based on block type
        switch (type) {
            case 'paragraph':
            case 'first-paragraph':
            case 'h2':
            case 'h3':
            case 'quote':
                newBlockData = { text: '' };
                break;
            case 'image':
                newBlockData = { url: '', caption: '' };
                break;
            // Add other cases here
            default:
                break;
        }
        
        const newBlock = createBlock(type, newBlockData);
        this.article.contentBlocks.push(newBlock);
        this.showBlockOptions = false;
        
        // Immediately open the new block for editing
        this.editBlock(this.article.contentBlocks.length - 1);
    },

    // Opens a block for editing
    editBlock(index) {
      this.editingIndex = index;
      // Create a deep copy to avoid modifying the original until save
      this.editingBlock = JSON.parse(JSON.stringify(this.article.contentBlocks[index]));
    },

    // Saves the changes to the block
    updateBlock() {
      if (this.editingIndex !== null) {
        // You might want to add validation here
        this.article.contentBlocks[this.editingIndex] = this.editingBlock;
        this.cancelEdit();
      }
    },

    // Cancels the editing of a block
    cancelEdit() {
      this.editingIndex = null;
      this.editingBlock = null;
    },

    // Deletes a block
    deleteBlock(index) {
        if (confirm('Are you sure you want to delete this block?')) {
            this.article.contentBlocks.splice(index, 1);
        }
    },

    // For Preview Page
    returnToEdit() {
      window.location.href = "/article/create";
    },

    // --- Preview and Save methods ---
    previewArticle() {
      localStorage.setItem("articlePreview", JSON.stringify(this.article));
      window.location.href = "/article/preview";
    },

    async saveArticle() {
      if (!this.article.imageUrl) {
        window.Alpine.store('ui').showToast('Please upload a cover image before saving.', 'error');
        return;
      }

      try {
        const result = await articlesApi.create({
          title: this.article.title,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          authorId: "HxpjsagLQxlUb2oCiM6h",
          content: this.article.contentBlocks,
          category: this.article.category,
        });

        window.Alpine.store('ui').showToast('Article saved successfully!');
        localStorage.removeItem('articlePreview');
        window.location.href = `/article/${result.id}`;
      } catch (error) {
        console.error('Failed to save article:', error);
        const message = error instanceof Error ? error.message : 'An error occurred while saving the article.';
        window.Alpine.store('ui').showToast(message, 'error');
      }
    },

    ...initialState,
  };
}
