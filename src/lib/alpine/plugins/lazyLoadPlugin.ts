import type { Alpine } from 'alpinejs';

const components: Record<string, () => Promise<any>> = {
  calendar: () => import('@/components/calendar/logic'),
  articleCreator: () => import('@/components/article/creatorLogic'),
  authModal: () => import('@/components/auth/authLogic'),
  profile: () => import('@/components/profile/profileLogic'),
};

export default function(Alpine: Alpine) {
  Alpine.magic('lazy', () => (name: string, initialState: object) => {
    return {
      isLazyLoading: true,
      init() {
        const importer = components[name];
        if (!importer) {
          console.error(`[Lazy Plugin] Importer for ${name} not found.`);
          return;
        }

        return importer()
          .then(module => {
            const data = module.default(initialState);
            Object.assign(this, data);
            
            if (typeof this.init === 'function') {
              this.init.call(this);
            }

            this.$nextTick(() => {
              this.isLazyLoading = false;
            });
          })
          .catch(err => {
            console.error(`[Lazy Plugin] Error during lazy-load of ${name}`, err);
          });
      },
      // Provide a full skeleton to prevent errors
      // --- Calendar properties ---
      selectedDate: null,
      year: 0,
      month: 0,
      monthName: '...',
      daysInMonth: 0,
      firstDayOfMonth: 0,
      events: [],
      filters: [],
      activeFilter: 'все',
      updateCalendarDisplay() {},
      changeMonth() {},
      selectDate() {},
      hasEvent() { return false; },
      setFilter() {},
      isSameDay() { return false; },
      updateFilteredEvents() {},
      filteredEvents: [],
      smallEvents: [],
      // --- Article Creator properties ---
      article: { title: '', imageUrl: '', paragraphs: [] },
      newParagraph: '',
      showTextarea: false,
      isPreview: false,
      editingIndex: null,
      editingText: '',
      isEditingTitle: false,
      editingTitleText: '',
      uploading: false,
      uploadProgress: 0,
      handleImageUpload() {},
      addParagraph() {},
      addNewParagraph() {},
      cancelParagraph() {},
      editParagraph() {},
      updateParagraph() {},
      cancelEdit() {},
      editTitle() {},
      saveTitle() {},
      cancelEditTitle() {},
      previewArticle() {},
      returnToEdit() {},
      saveArticle() {},
      // --- Auth Modal properties ---
      formType: 'login',
      formData: { email: '', password: '', confirmPassword: '', firstName: '', lastName: '' },
      error: '',
      isLoading: false,
      switchTo() {},
      handleSubmit() {},
      // --- Profile Page properties ---
      form: { firstName: '', lastName: '' },
      saveChanges() {},
      deleteAccount() {},
    };
  });
}