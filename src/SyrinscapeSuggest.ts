import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    Notice,
    TFile,
    requestUrl
} from "obsidian"
import * as Papa from 'papaparse';
import SyrinscapePlugin from "main";
import { debug } from "SyrinscapeDebug";
import { SyrinscapeSound } from "SyrinscapeSound";

;
  
/**
 * Implements the EditorSuggest interface to provide completions for Syrinscape sounds.
 */
export default class SyrinscapeSuggest extends EditorSuggest<SyrinscapeSound> {
    app: App;
    private plugin: SyrinscapePlugin;
    // Map of title to Syrinscape Completion objects
    private remoteLinks: Map<string, SyrinscapeSound> = new Map();
    

    constructor(app: App, plugin: SyrinscapePlugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }

    /**
     * Split the query into words and return the completions that match every word in the query, regardless of order.
     * @param context the context object containing the query and the editor
     * @returns a list of completions that match every word in the query
     */
    getSuggestions(context: EditorSuggestContext): SyrinscapeSound[] {
        const query = context.query.toLowerCase();
        const queryWords = query.split(' ');
        const completions = Array.from(this.remoteLinks.values());
        if (!query) {
            return completions;
        }
        return completions.filter(completion => {
            const titleWords = completion.title.toLowerCase().split(' ');
            // append the completion id and type to the titleWords array so that users can search for them
            titleWords.push(completion.id, completion.type);
            return queryWords.every(queryWord => titleWords.some(titleWord => titleWord.contains(queryWord)));
        });
    }

    /**
     * Download the CSV file of remote links from the Syrinscape website and parse it into the remoteLinks map.
     * @returns a promise that fetches the remote links from the Syrinscape website and parses them into the remoteLinks map.
     */
    async fetchRemoteLinks(): Promise<void> {
        // if the remoteLinks map is not empty, then we have already fetched the remote links
        if (this.plugin.settings.csvContent.length > 0) {
            debug(`Syrinscape - Remote links already fetched. Skipping download.`);
            this.parseRemoteLinks(this.plugin.settings.csvContent);
            return;
        }
        debug("Syrinscape - Downloading CSV file of remote links.");
        try {
            const response = await requestUrl({
                url: 'https://syrinscape.com/account/remote-control-links-csv/',
                method: 'GET',
                contentType: 'application',
                headers: {
                    'Authorization': `Token ${this.plugin.settings.authToken}`
                }
            });

            const csvContent = response.text;
            this.plugin.settings.csvContent = csvContent;
            this.plugin.settings.lastUpdated = new Date();
            await this.plugin.saveSettings();
            new Notice("Completed download of Syrinscape remote links")
            this.parseRemoteLinks(csvContent);
        } catch (error) {
            console.error('Syrinscape - Failed to fetch remote links:', error);
            new Notice('Failed to fetch Syrinscape remote links.');
        }
    }
  
    /**
     * Convert the CSV content into a map of remote links.
     * @param csvContent the CSV content to parse into the remoteLinks map
     */
    parseRemoteLinks(csvContent: string): void {
        //parse csvContent as a CSV where the first row contains the column names.
        Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                this.remoteLinks.clear(); // Clear existing entries in the map
                for (const row of results.data as SyrinscapeRemoteLink[]) {
                    const soundTitle = `${row.name} (${row.soundset})`;
                    const sound = new SyrinscapeSound(row.id.substring(2), row.type === 'element' ? row.sub_type : row.type, soundTitle);
                    this.remoteLinks.set(`${sound.type} ${sound.id} ${sound.title.toLowerCase()}`, sound);
                }
                debug(`Syrinscape - Completed parsing of CSV file of ${this.remoteLinks.size} remote links`)
            },
            error: (error: unknown) => {
                console.error('Syrinscape - Error parsing CSV:', error);
            }
        });
    }
    
    /**
     * Display the suggestion in the suggestions container.
     * @param suggestion The suggestion to render
     * @param el the HTML element to render the suggestion in
     */
    renderSuggestion(suggestion: SyrinscapeSound, el: HTMLElement): HTMLElement {
        return el.createSpan({cls: "syrinscape-suggestion", text: `${suggestion.type}:${suggestion.id}:${suggestion.title}`});
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectSuggestion(suggestion: SyrinscapeSound, _evt: MouseEvent | KeyboardEvent): void {
        debug('selectSuggestion:', suggestion);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
        const triggerWord = `\`${this.plugin.settings.triggerWord}:`;        

        const startOfTriggerWord = this.findTriggerWordOccurrence(editor.getLine(cursor.line), triggerWord, cursor.ch);
        if (startOfTriggerWord<0) {
            return null // trigger word not found before the cursor - return null to indicate that this class cannot service the request.
        }
        // If triggerWord is found, proceed with creating the trigger info
        const startPos: EditorPosition = { line: cursor.line, ch: startOfTriggerWord };
        const query = editor.getLine(cursor.line).slice(startOfTriggerWord + triggerWord.length, cursor.ch);

        startPos.ch = startOfTriggerWord;
        return {
            start: startPos,
            end: cursor,
            query: query
        }
    }
}

interface SyrinscapeRemoteLink {
    id: string;
    status: string;
    subcategory: string;
    product_or_pack: string;
    soundset: string;
    name: string;
    type: string;
    sub_type: string;
    genre_players_play_url: string;
    genre_players_stop_url: string;
    online_player_play_url: string;
    online_player_stop_url: string;
}
