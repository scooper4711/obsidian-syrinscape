import {
    App,
    Notice,
    Component,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    requestUrl,
    TFile
} from "obsidian"
import type SyrinscapePlugin from "main";

interface SyrinscapeCompletion {
    id: string,
    type: string,
    title: string
}

export default class SyrinscapeSuggest extends EditorSuggest<SyrinscapeCompletion> {
    app: App;
    private plugin: SyrinscapePlugin;
    private syrinscapeSuggestions: SyrinscapeCompletion[];

    constructor(app: App, plugin: SyrinscapePlugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }

    getSuggestions(context: EditorSuggestContext): SyrinscapeCompletion[] {
        this.getSuggestionsFromSyrinscape(context)
        console.debug('getSuggestions:', this.syrinscapeSuggestions);
        return this.syrinscapeSuggestions;
    }

    getSuggestionsFromSyrinscape(context: EditorSuggestContext) {
        let needle = context.query;
        const searchUrl = `https://syrinscape.com/search/?q=${needle}&pp=10&f=json&kind=Oneshots&kind=Moods&library=Available+to+Play`;
        console.debug('searchUrl:', searchUrl);
        const response = requestUrl({
            url: searchUrl,
            method: 'GET',
            contentType: 'application',
            headers: {
                'Authorization': `Token ${this.plugin.settings.authToken}`
            }
        });
        response.text.then((text: string) => {
            // parse data as json
            const json = JSON.parse(text);
            console.debug('API response:', json);
            // if the return code isn't 200, display a notice with the detail
            if (json.detail) {
                new Notice(json.detail)
            } else {
                // convert the data returned in data.results to a list of SyrinscapeCompletion objects where id is the field pk, and type is the field meta.id
                // and title is the field title
                this.syrinscapeSuggestions = json.results.map((result: any) => {
                    const metaId = result.meta.id.split(':');
                    return {
                        id: result.pk,
                        type: metaId[0]==='Mood' ? 'mood' : 'element',
                        title: `${result.title} (${result.adventure_title})`
                    }
                });
                console.debug('suggestions:', this.syrinscapeSuggestions);
            }
        }).catch((error: any) => {
            this.syrinscapeSuggestions = [];
            console.error('Error fetching data:', error);
            new Notice('Failed to fetch data from Syrinscape API');
        })
    }

    renderSuggestion(suggestion: SyrinscapeCompletion, el: HTMLElement) {
        console.debug('renderSuggestion suggestion:', suggestion);
        const suggestionsContainerEl = el.setText(`${suggestion.type}:${suggestion.id}:${suggestion.title}`);
        // calloutContainerEl.setAttribute('data-callout-manager-callout', callout.label);
        // const { icon, color, label } = callout;
        // new SuggestionPreviewComponent(suggestionsContainerEl, suggestion);
    }

    selectSuggestion(suggestion: SyrinscapeCompletion, _evt: MouseEvent | KeyboardEvent): void {
        const editor = this.context!.editor;
        const selectedText = `${suggestion.type}:${suggestion.id}:${suggestion.title}`
        // let callout = this.plugin.parseCallout(value.label);
        // calloutStr = callout.formattedString;

        editor.replaceRange(selectedText, editor.getCursor('head'), editor.getCursor('to'));
    }

    onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
        const triggerWord = this.plugin.settings.triggerWord;
        const startPos = this.context?.start || {
            line: cursor.line,
            ch: 1
        }
        console.debug('range: ', editor.getRange(startPos, cursor));
        if (!editor.getRange(startPos, cursor).startsWith(triggerWord + ":")) {
            return null
        }

        return {
            start: startPos,
            end: cursor,
            query: editor.getRange(startPos, cursor).substring(triggerWord.length + 1)
        }
    }

    open(): void {
        console.debug('open');
        super.open();
    }
}

/**
 * A component that displays a preview of a callout.
 */
export class SuggestionPreviewComponent extends Component {

    public constructor(containerEl: HTMLElement, options: SyrinscapeCompletion) {
        super();
        // const { icon, label } = options;

        const frag = document.createDocumentFragment();

        // Build the callout.
        const suggestionEL = containerEl.createSpan({ cls: ['syrinscape-suggestion'] });
        suggestionEL.textContent = `syrinscape:${options.type}:${options.id}:${options.title}`;

        // Attach to the container.
        // SuggestionPreviewComponent.prototype.attachTo.call(this, containerEl);
    }

    /**
     * Changes the callout ID.
     * This will *not* change the appearance of the preview.
     *
     * @param id The new ID to use.
     */
    public setCalloutID(id: string): typeof this {
        // const { calloutEl } = this;
        // calloutEl.setAttribute('data-callout', id);
        return this;
    }

    /**
     * Changes the callout icon.
     *
     * @param icon The ID of the new icon to use.
     */
    public setIcon(icon: string): typeof this {
        // const { iconEl } = this;

        // // Clear the icon element and append the SVG.
        // iconEl.empty();
        // const iconSvg = getIcon(icon);
        // if (iconSvg != null) {
        //     this.iconEl.appendChild(iconSvg);
        // }

        return this;
    }

    /**
     * Attaches the callout preview to a DOM element.
     * This places it at the end of the element.
     *
     * @param containerEl The container to attach to.
     */
    public attachTo(containerEl: HTMLElement): typeof this {
        // containerEl.appendChild(this.calloutEl);
        return this;
    }
}