import {
    type DecorationSet,
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType
} from "@codemirror/view";
import { EditorSelection, Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import {
    TFile,
    editorEditorField,
    editorLivePreviewField,
    editorInfoField
} from "obsidian";
import SyrinscapePlugin from "main";
import { SyrinscapeSound } from "SyrinscapeSound";

function selectionAndRangeOverlap(
    selection: EditorSelection,
    rangeFrom: number,
    rangeTo: number
) {
    for (const range of selection.ranges) {
        if (range.from <= rangeTo && range.to >= rangeFrom) {
            return true;
        }
    }

    return false;
}

function inlineRender(view: EditorView, plugin: SyrinscapePlugin) {
    const currentFile = this.app.workspace.getActiveFile();
    if (!currentFile) return;

    const widgets: Range<Decoration>[] = [];
    const selection = view.state.selection;
    const regex = new RegExp(".*?_?inline-code_?.*");
    for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from,
            to,
            enter: ({ node }) => {
                const type = node.type;
                // markdown formatting symbols
                if (type.name.includes("formatting")) return;
                if (!regex.test(type.name)) return;

                // contains the position of node
                const start = node.from;
                const end = node.to;
                // don't continue if current cursor position and inline code node (including formatting
                // symbols) overlap
                if (selectionAndRangeOverlap(selection, start, end)) return;

                const original = view.state.doc.sliceString(start, end).trim();
                if (!/^syrinscape(?:\+|\-|\-mod)?:\s*([\s\S]+)\s*?/.test(original))
                    return;
                const sound = plugin.parseSoundString(original);
                if (!sound) return;
                const widget = new SyrinscapePlayerWidget(
                    original,
                    view,
                    plugin,
                    sound
                );

                widgets.push(
                    Decoration.replace({
                        widget,
                        inclusive: false,
                        block: false
                    }).range(start - 1, end + 1)
                );
            }
        });
    }
    return Decoration.set(widgets, true);
}

export class SyrinscapePlayerWidget extends WidgetType {
    constructor(
        readonly rawQuery: string,
        private view: EditorView,
        private plugin: SyrinscapePlugin,
        private sound: SyrinscapeSound
    ) {
        super();
    }

    // Widgets only get updated when the raw query changes/the element gets focus and loses it
    // to prevent redraws when the editor updates.
    eq(other: SyrinscapePlayerWidget): boolean {
        return other.rawQuery === this.rawQuery;
    }

    toDOM() {
        let element = document.createElement("span");
        this.sound.renderSpan(element);
        return element;
    }

    /* Make queries only editable when shift is pressed (or navigated inside with the keyboard
     * or the mouse is placed at the end, but that is always possible regardless of this method).
     * Mostly useful for links, and makes results selectable.
     * If the widgets should always be expandable, make this always return false.
     */
    ignoreEvent(event: MouseEvent | Event): boolean {
        // instanceof check does not work in pop-out windows, so check it like this
        if (event.type === "mousedown") {
            const currentPos = this.view.posAtCoords({
                x: (event as MouseEvent).x,
                y: (event as MouseEvent).y
            });
            if ((event as MouseEvent).shiftKey) {
                // Set the cursor after the element so that it doesn't select starting from the last cursor position.
                if (currentPos) {
                    //@ts-ignore
                    const { editor } = this.view.state
                        .field(editorEditorField)
                        .state.field(editorInfoField);
                    if (editor) {
                        editor.setCursor(editor.offsetToPos(currentPos));
                    }
                }
                return false;
            }
        }
        return true;
    }
}
export function inlinePlugin(plugin: SyrinscapePlugin) {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;
            constructor(view: EditorView) {
                this.decorations = Decoration.none;
            }

            update(update: ViewUpdate) {
                // only activate in LP and not source mode
                if (!update.state.field(editorLivePreviewField)) {
                    this.decorations = Decoration.none;
                    return;
                }
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.selectionSet
                ) {
                    this.decorations =
                        inlineRender(update.view, plugin) ?? Decoration.none;
                }
            }
        },
        { decorations: (v) => v.decorations }
    );
}
