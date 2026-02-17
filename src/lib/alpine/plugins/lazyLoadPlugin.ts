import type { Alpine } from 'alpinejs';

const components: Record<string, () => Promise<any>> = {
  layout: () => import('@/Layouts/layoutLogic'),
  navbar: () => import('@/components/common/navbarLogic'),
  articleList: () => import('@/components/dashboard/articleListLogic'),
  flipperList: () => import('@/components/dashboard/flipperListLogic'),
  profile: () => import('@/components/profile/profileLogic'),
  calendar: () => import('@/components/calendar/logic'),
  articleCreator: () => import('@/components/article/creatorLogic'),
  flipperCreator: () => import('@/components/dashboard/flipperCreatorLogic'),
  eventCreator: () => import('@/components/article/eventCreatorLogic'),
  eventList: () => import('@/components/dashboard/eventListLogic'),
  authModal: () => import('@/components/auth/authLogic'),
  interviewList: () => import('@/components/dashboard/interviewListLogic'),
  interviewCreator: () => import('@/components/dashboard/interviewCreatorLogic'),
  newsCreator: () => import('@/components/dashboard/newsCreatorLogic'),
  newsList: () => import('@/components/dashboard/newsListLogic'),
  subscriptionManager: () => import('@/components/profile/subscriptionLogic'),
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
            
            // Extract the loaded module's init function, if it exists
            const newInit = data.init;
            
            // Remove init from the data object to avoid conflicts/recursion
            delete data.init;

            Object.assign(this, data);
            
            // If the loaded module had an init, call it now
            if (typeof newInit === 'function') {
              newInit.call(this);
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
      article: {
        title: '',
        imageUrl: '',
        imageCaption: '',
        contentBlocks: [],
        tags: [],
        techTags: [],
        tips: [],
        category: '',
        isHotContent: false,
      },
      // --- Interview Creator properties ---
      interview: {
        title: '',
        imageUrl: '',
        imageCaption: '',
        contentBlocks: [],
        tags: [],
      },
      showBlockOptions: false,
      editingIndex: null,
      editingBlock: null,
      isEditingTitle: false,
      editingTitleText: '',
      isEditingCaption: false,
      editingCaptionText: '',
      uploading: false,
      uploadProgress: 0,
      categoryTags: {},
      articleId: null,
      isEditMode: false,
      onSaveRedirect: null,
      newTagInput: '',
      categoryLabels: {},
      tipOptions: [],
      authorsLoading: false,
      authors: [],
      selectedAuthorId: '',
      useNewAuthor: false,
      newAuthorFirstName: '',
      newAuthorLastName: '',
      getCategoryLabel() { return 'Category'; },
      getAvailableTags() { return []; },
      getTagLabel(value: string) { return value; },
      getAuthorLabel() { return ''; },
      isTagSelected() { return false; },
      toggleTag() {},
      removeTag() {},
      addCustomTag() {},
      removeTechTag() {},
      isTipSelected() { return false; },
      toggleTip() {},
      getTipText() { return ''; },
      setTipText() {},
      loadAuthors() {},
      resolveAuthorId() { return ''; },
      handleCategoryChange() {},
      handleImageUpload() {},
      openBlockSelector() {},
      addBlock() {},
      editBlock() {},
      updateBlock() {},
      cancelEdit() {},
      deleteBlock() {},
      editTitle() {},
      saveTitle() {},
      cancelEditTitle() {},
      editCaption() {},
      saveCaption() {},
      cancelEditCaption() {},
      previewArticle() {},
      returnToEdit() {},
      saveArticle() {},
      // --- Event Creator defaults ---
      eventId: null,
      eventForm: {
        startDate: '',
        endDate: '',
        dateType: 'single',
        address: '',
        timeMode: 'none',
        startTime: '',
        endTime: '',
        category: '',
        isOnLanding: false,
        isMainEvent: false,
      },
      setStartDate() {},
      setEndDate() {},
      setDateType() {},
      setTimeMode() {},
      setCategory() {},
      saveEvent() {},
      deleteEvent() {},
      // --- Event List defaults ---
      apiBase: '',
      buildApiUrl() { return ''; },
      notify() {},
      confirmAndDelete() {},
      handleDeleteClick() {},
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
      // --- Flipper Creator properties ---
      flipper: {
        title: '',
        category: '',
        tags: [],
        techTags: [],
        carouselContent: [],
      },
      uploadingIndex: -1,
      addCarouselItem() {},
      removeCarouselItem() {},
      saveFlipper() {},
      // --- Subscription Manager properties ---
      isSubscribed: false,
      subscriptionStatus: '',
      subscriptionEndDate: '',
      createSubscription() {},
      manageSubscription() {},
    };
  });
}
