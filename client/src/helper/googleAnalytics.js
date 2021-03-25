import ReactGA from "react-ga";

const gaEvent = (category, action, label) => {
    ReactGA.event({
        category: category,
        action: action,
        label: label
    });
};

export default gaEvent;