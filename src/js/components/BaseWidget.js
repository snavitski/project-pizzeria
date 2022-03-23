class BaseWidget {
	constructor(wrapperElement, initialValue) {
		const thisWidget = this;

		thisWidget.dom = {};
		thisWidget.dom.wrapper = wrapperElement;

		thisWidget.value = initialValue;
	}

	setValue(value) {
		const thisWidget = this;
		const newValue = thisWidget.parseValue(value);
		/*TODO Add validation*/
		if (
			thisWidget.value !== newValue &&
			!isNaN(newValue) &&
			isValid(newValue)
		) {
			thisWidget.value = newValue;
		}
		thisWidget.announce();
		thisWidget.renderValue();
	}
	parseValue(value) {
		return parsInt(value);
	}

	isValid(value) {
		return !isNaN(value);
	}
	renderValue() {
		const thisWidget = this;
		thisWidget.wrapper.innerHTML = thisWidget.value;
	}
	announce() {
		const thisWidget = this;
		const event = new CustomEvent("update", {
			bubbles: true,
		});
		thisWidget.element.dispatchEvent(event);
	}
}
export default BaseWidget;
