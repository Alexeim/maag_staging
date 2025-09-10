export default (imagePaths: { theatreShowSrc: string; smallEventSrc: string; }) => ({
    // State
    selectedDate: new Date(),
    year: new Date().getUTCFullYear(),
    month: new Date().getUTCMonth(), // 0-11
    
    // Derived State
    monthName: '',
    daysInMonth: 0,
    firstDayOfMonth: 0,
    filteredEvents: [],

    // Static Data
    events: [
      { id: 1, date: new Date(Date.UTC(2025, 8, 12)), title: 'Событие 1', tag: 'Выставка', location: 'Место 1', image: imagePaths.theatreShowSrc },
      { id: 2, date: new Date(Date.UTC(2025, 8, 12)), title: 'Событие 2', tag: 'Концерт', location: 'Место 2', image: imagePaths.smallEventSrc },
      { id: 3, date: new Date(Date.UTC(2025, 8, 15)), title: 'Событие 3', tag: 'Выставка', location: 'Место 3', image: imagePaths.theatreShowSrc },
      { id: 4, date: new Date(Date.UTC(2025, 9, 5)), title: 'Событие 4', tag: 'Спектакль', location: 'Место 4', image: imagePaths.smallEventSrc },
    ],
    filters: ['все', 'Выставка', 'Концерт', 'Спектакль'],
    activeFilter: 'все',

    init() {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      this.selectedDate = today;
      this.year = today.getUTCFullYear();
      this.month = today.getUTCMonth();
      this.updateCalendarDisplay();
      this.updateFilteredEvents();
    },

    updateCalendarDisplay() {
      const firstDay = new Date(Date.UTC(this.year, this.month, 1));
      this.monthName = firstDay.toLocaleDateString('ru-RU', { month: 'long', timeZone: 'UTC' });
      this.daysInMonth = new Date(Date.UTC(this.year, this.month + 1, 0)).getUTCDate();
      this.firstDayOfMonth = (firstDay.getUTCDay() + 6) % 7; // 0 = Mon
    },

    updateFilteredEvents() {
      if (!this.selectedDate) {
        this.filteredEvents = [];
        return;
      }
      const filteredByDate = this.events.filter(event => this.isSameDay(event.date, this.selectedDate));
      if (this.activeFilter === 'все') {
        this.filteredEvents = filteredByDate;
      } else {
        this.filteredEvents = filteredByDate.filter(event => event.tag === this.activeFilter);
      }
    },

    changeMonth(direction: number) {
      this.month += direction;
      if (this.month < 0) {
        this.month = 11;
        this.year--;
      }
      if (this.month > 11) {
        this.month = 0;
        this.year++;
      }
      this.updateCalendarDisplay();
    },

    selectDate(day: number) {
      this.selectedDate = new Date(Date.UTC(this.year, this.month, day));
      this.updateFilteredEvents();
    },

    hasEvent(day: number) {
      const date = new Date(Date.UTC(this.year, this.month, day));
      return this.events.some(event => this.isSameDay(event.date, date));
    },
    
    setFilter(filter: string) {
      this.activeFilter = filter;
      this.updateFilteredEvents();
    },

    isSameDay(date1: Date, date2: Date) {
        if (!date1 || !date2) return false;
        return date1.getUTCFullYear() === date2.getUTCFullYear() &&
               date1.getUTCMonth() === date2.getUTCMonth() &&
               date1.getUTCDate() === date2.getUTCDate();
    },

    get smallEvents() {
        return this.events.slice(0, 2);
    }
});