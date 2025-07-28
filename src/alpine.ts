document.addEventListener("alpine:init", () => {
  Alpine.data("calendar", (initialData) => ({
    // Image Paths are now passed directly
    theatreShowSrc: initialData.theatreShowSrc || "",
    smallEventSrc: initialData.smallEventSrc || "",

    // Mock Data
    events: [
      {
        id: 1,
        date: "2025-09-08",
        tag: "балет",
        title:
          "”Весна священная/ общая земля”— легендарный спектакль Пины Бауш.",
        description:
          "Какой-то опциональный дополнительный текст с отсылками на другие материалы.",
        location: "La Vilette, 30 avenue Corentin Cariou",
        time: "19.00, продолжительность 1,5 час",
        duration: "до 11 октября",
        buttonText: "Подробнее",
      },
      {
        id: 2,
        date: "2025-09-08",
        tag: "опера",
        title: "Опера 'Кармен' в Опера Гарнье",
        description: "Классическая постановка знаменитой оперы.",
        location: "Опера Гарнье",
        time: "20:00",
        duration: "3 часа",
        buttonText: "Подробнее",
      },
      {
        id: 3,
        date: "2025-09-09",
        tag: "выставка",
        title: "Выставка импрессионистов в Орсе",
        description: "Работы Моне, Ренуара и Дега.",
        location: "Музей Орсе",
        time: "10:00 - 18:00",
        duration: "весь день",
        buttonText: "Подробнее",
      },
    ],
    smallEvents: [
      {
        tag: "Выставка",
        title: "Огюст Роден и его бабы.",
        location: "Место",
      },
      {
        tag: "Концерт",
        title: "Джазовый вечер в Le Duc des Lombards.",
        location: "Le Duc des Lombards",
      },
      {
        tag: "Перфоманс",
        title: "Современный танец в центре Помпиду.",
        location: "Центр Помпиду",
      },
      {
        tag: "Балет",
        title: "Классический балет 'Лебединое озеро'.",
        location: "Опера Бастилии",
      },
    ],
    filters: [
      "концерт",
      "выставка",
      "балет",
      "опера",
      "перфоманс",
      "Парижская опера",
      "Лувр",
      "Орсе",
      "Макрон",
    ],

    // State - ALL DATES ARE IN UTC
    currentDate: new Date(Date.UTC(2025, 8, 1)), // September 1st, UTC
    selectedDate: new Date(Date.UTC(2025, 8, 8)), // September 8th, UTC
    activeFilter: "все",

    // Getters - Use UTC methods
    get monthName() {
      return this.currentDate.toLocaleString("ru-RU", {
        month: "long",
        timeZone: "UTC",
      });
    },
    get year() {
      return this.currentDate.getUTCFullYear();
    },
    get daysInMonth() {
      return new Date(
        this.currentDate.getUTCFullYear(),
        this.currentDate.getUTCMonth() + 1,
        0
      ).getUTCDate();
    },
    get firstDayOfMonth() {
      let day = new Date(
        Date.UTC(
          this.currentDate.getUTCFullYear(),
          this.currentDate.getUTCMonth(),
          1
        )
      ).getUTCDay();
      return day === 0 ? 6 : day - 1; // Adjust to make Monday the first day (0)
    },
    get filteredEvents() {
      const selected = this.selectedDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
      return this.events.filter((event) => {
        const eventDate = event.date; // Already "YYYY-MM-DD"
        const filterMatch =
          this.activeFilter === "все" ||
          event.tag.toLowerCase() === this.activeFilter.toLowerCase();
        return eventDate === selected && filterMatch;
      });
    },

    // Methods - Use UTC methods
    changeMonth(amount) {
      const newDate = new Date(this.currentDate);
      newDate.setUTCMonth(newDate.getUTCMonth() + amount);
      this.currentDate = newDate;
    },
    selectDate(day) {
      this.selectedDate = new Date(
        Date.UTC(this.year, this.currentDate.getUTCMonth(), day)
      );
    },
    isSameDay(date1, date2) {
      return date1.toISOString().slice(0, 10) === date2.toISOString().slice(0, 10);
    },
    hasEvent(day) {
      const checkDate = new Date(
        Date.UTC(this.year, this.currentDate.getUTCMonth(), day)
      );
      const checkDateString = checkDate.toISOString().slice(0, 10);
      return this.events.some((event) => event.date === checkDateString);
    },
    setFilter(filter) {
      this.activeFilter = filter;
    },
  }));
});
