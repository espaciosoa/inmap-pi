export default class JSUtils {

    /**
     * Converts a string into an HTML Document Fragment that can be added to the DOM (Does not work with table elements)
     * @param txt
     * @returns {DocumentFragment} The HTML node generated from the passed string (you can't see it in the console)
     * @example
     * let txtHTML = `<h1> This is a header</h1>`;
     * const htmlNode = txtToHtmlNode(txtHTML);
     * // htmlNode is ready to be added to the DOM
     * document.querySelector("#container").append(htmlNode);
     */
    static txtToHtmlDocumentFragment(txt) {
        return document.createRange().createContextualFragment(txt);
    }

    /**
     * Converts a string into an HTMLNode that can be added to the DOM (Does not work with table elements)
     * @param htmlStr {string}
     * @returns {Element} The HTML element generated from the passed string
     * @example
     * let txtHTML = `<h1> This is a header</h1>`;
     * const htmlNode = txtToHTMLNode(txtHTML);
     * // htmlNode is ready to be added to the DOM
     * document.querySelector("#container").append(htmlNode);
     */
    static txtToHTMLNode(htmlStr) {
        const tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = htmlStr;
        const node = tmpDiv.firstElementChild;
        return node;
    }


    /**
     * Allows defining a text string with placeholder values that will be later be replaced using the keys of a provided object.
     * Requires using a special syntax for named placeholders : {{myPlaceholder}}
     * @param {string} template the string containing the placeholders to replace
     * @param {Object} replacements an object with the strings to replace
     * @returns {*} a new string resulting of the substitution of placeholders for actual values.
     * @example
     * let myPlaceholder_HTMLTemplate = "<p> My name is {{name}}, my age is {{age}}. {{Greeting}}</p>"
     * //Produces : "<p> My name is Michael Scott, my age is 43. Hi lads!</p>"
     * let stringAfterReplacement = JSHelpers.replaceTemplatePlaceholders(myPlaceholder_HTMLTemplate,
     *         {
     *             name: "Michael Scott",
     *             age: 43,
     *             Greeting: "Hi lads!"
     *         });
     */
    static replaceTemplatePlaceholders(template, replacements) {
        const placeholderRegex = /{{(.*?)}}/g;

        return template.replace(placeholderRegex, (_, placeholderName) => {
            return replacements[placeholderName.trim()] || "";
        });
    }
    static isString(x) {
        return typeof x === "string" || x instanceof String || Object.prototype.toString.call(x) === "[object String]"
    }
}