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
    title: string,
    display: string,
    query: string
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
        console.debug('getSuggestions:', this.syrinscapeSuggestions);
        return this.syrinscapeSuggestions;
    }

    async getSuggestionsFromSyrinscape(query: string) {
        // get the query from the context and URLEncode it to make it safe for the API
        let needle = encodeURIComponent(query);
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
        // await the response and get the text as a string
        const text = await response.text;
        try {
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
                        query: query,
                        type: metaId[0]==='Mood' ? 'mood' : 'element',
                        title: `${result.title} (${result.adventure_title?result.adventure_title:result.chapter_title})`,
                        display: `${result.meta.highlight.title?result.meta.highlight.title:result.title} (${result.adventure_title?result.adventure_title:result.chapter_title})`
                    }
                });
                console.debug('suggestions:', this.syrinscapeSuggestions);
            }
        } catch(error: any) {
            this.syrinscapeSuggestions = [];
            console.error('Error fetching data:', error);
            new Notice('Failed to fetch data from Syrinscape API');
        }
    }

    renderSuggestion(suggestion: SyrinscapeCompletion, el: HTMLElement) {
        const suggestionsContainerEl = el.innerHTML=`${suggestion.type}:${suggestion.id}:${suggestion.display}`;
    }

    selectSuggestion(suggestion: SyrinscapeCompletion, _evt: MouseEvent | KeyboardEvent): void {
        console.debug('selectSuggestion:', suggestion);
        const editor = this.context!.editor;
        const selectedText = `${suggestion.type}:${suggestion.id}:${suggestion.title}`

        const from: EditorPosition = {ch: editor.getCursor('from').ch - this.context!.query.length, line: editor.getCursor('from').line};
        editor.replaceRange(selectedText, from, editor.getCursor('to'));
    }

    findTriggerWordOccurrence(editorLine: string, triggerWord: string, cursor: number): number {
        // Step 1: Slice the string to only consider text before the cursor index
        const textBeforeCursor = editorLine.slice(0, cursor);
    
        // Step 2: Search for the last occurrence of triggerWord in the sliced string
        const triggerWordIndex = textBeforeCursor.lastIndexOf(triggerWord);
    
        // Step 3: Return the index of the triggerWord occurrence, or -1 if not found
        return triggerWordIndex;
    }

    /** 
     * This method is called on every key press. Returns null as quickly as possible if this class cannot
     * service the request for code completions (e.g. it doesn't match the trigger word).
     * If it does, then it should return an EditorSuggestTriggerInfo object with the range of the trigger word and the query.
     * That EditorSuggestTriggerInfo object will be passed to getSuggestions as an EditorSuggestContext.
     */
    onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
        const triggerWord = `\`${this.plugin.settings.triggerWord}:`;        

        const startOfTriggerWord = this.findTriggerWordOccurrence(editor.getLine(cursor.line), triggerWord, cursor.ch);
        if (startOfTriggerWord<0) {
            return null // trigger word not found before the cursor - return null to indicate that this class cannot service the request.
        }
        // If triggerWord is found, proceed with creating the trigger info
        const startPos: EditorPosition = { line: cursor.line, ch: startOfTriggerWord };
        const query = editor.getLine(cursor.line).slice(startOfTriggerWord + triggerWord.length, cursor.ch);

        console.debug('onTrigger - query:', query);
        this.getSuggestionsFromSyrinscape(query);
        startPos.ch = startOfTriggerWord;
        return {
            start: startPos,
            end: cursor,
            query: query
        }
    }
}
