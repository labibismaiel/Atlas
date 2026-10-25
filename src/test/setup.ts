// jsdom does not implement layout APIs; stub the ones the app calls.
Element.prototype.scrollIntoView = function scrollIntoView() {}
