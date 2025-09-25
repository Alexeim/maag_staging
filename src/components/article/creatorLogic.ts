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
    isEditingImageUrl: false,
    editingImageUrlText: "",

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

    // --- Image URL editing methods ---
    editImageUrl() {
      this.isEditingImageUrl = true;
      this.editingImageUrlText = this.article.imageUrl;
    },
    saveImageUrl() {
      this.article.imageUrl = this.editingImageUrlText;
      this.isEditingImageUrl = false;
    },
    cancelEditImageUrl() {
      this.isEditingImageUrl = false;
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
      try {
        const response = await fetch("http://localhost:3000/api/articles", {
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
