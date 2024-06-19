import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile
} from "obsidian"
import Papa from 'papaparse';
import type SyrinscapePlugin from "main";

interface SyrinscapeCompletion {
    id: string,
    type: string,
    title: string,
}

export default class SyrinscapeSuggest extends EditorSuggest<SyrinscapeCompletion> {
    app: App;
    private plugin: SyrinscapePlugin;
    // Map of title to Syrinscape Completion objects
    private remoteLinks: Map<string, SyrinscapeCompletion> = new Map();
    

    constructor(app: App, plugin: SyrinscapePlugin) {
        super(app);
        this.app = app;
        this.plugin = plugin;
    }

    getSuggestions(context: EditorSuggestContext): SyrinscapeCompletion[] {
        const query = context.query.toLowerCase();
        const hits: SyrinscapeCompletion[]  = [];
        // find all remoteLinks where the query is contained in the key
        for (const [key, value] of this.remoteLinks.entries()) {
            if (key.includes(query)) {
                hits.push(value);
            }
        }            

        return hits;

    }

    parseRemoteLinks(csvContent: string): void {
        //parse csvContent as a CSV where the first row contains the column names.
        Papa.parse(csvContent, {
            header: true,
            complete: (results: PapaParseResult) => {
                this.remoteLinks.clear(); // Clear existing entries in the map
                for (const row of results.data) {
                    const soundTitle = `${row.name} (${row.soundset})`;
                    const completion: SyrinscapeCompletion = {
                        id: row.id.substring(2), //remove the e|m and colon characters.
                        type: row.type, // either mood or element
                        title: soundTitle, // Use the concatenated sound title for display
                    };
                    this.remoteLinks.set(soundTitle.toLowerCase(), completion);
                }
                console.log("Completed download of CSV file of remote links")
            },
            error: (error: any) => {
                console.error('Error parsing CSV:', error);
            }
        });
    }
    
    renderSuggestion(suggestion: SyrinscapeCompletion, el: HTMLElement) {
        const suggestionsContainerEl = el.innerHTML=`${suggestion.type}:${suggestion.id}:${suggestion.title}`;
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

type PapaParseResult = {
    data: Array<SyrinscapeRemoteLink>;
    errors: Array<any>;
    meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        fields: Array<string>;
        truncated: boolean;
    };
}