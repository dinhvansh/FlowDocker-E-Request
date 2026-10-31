import { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { Compartment, EditorState, Prec, Transaction } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import {
  autocompletion,
  acceptCompletion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { forceLinting, linter } from "@codemirror/lint";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useI18n } from "@flowdocker/i18n";
import { analyzeFormCode, codeCompletions, codeNodeAt } from "./code-model";
import { getLocation } from "jsonc-parser";

const codePhraseKeys: Record<string, string> = {
  Completions: "Gợi ý mã",
  Diagnostics: "Chẩn đoán mã",
  "No diagnostics": "Không có lỗi mã",
  Find: "Tìm trong mã",
  Replace: "Thay thế trong mã",
  next: "Kết quả kế tiếp",
  previous: "Kết quả trước",
  all: "Chọn mọi kết quả",
  "match case": "Phân biệt hoa thường",
  regexp: "Biểu thức chính quy",
  "by word": "Theo từ",
  replace: "Thay kết quả",
  "replace all": "Thay tất cả kết quả",
  close: "Đóng bảng mã",
  "Go to line": "Đến dòng",
  go: "Đi đến",
  "Control character": "Ký tự điều khiển",
  "Folded lines": "Đã thu gọn các dòng",
  "Unfolded lines": "Đã mở các dòng",
  to: "đến",
  "folded code": "Mã đã thu gọn",
  unfold: "Mở mã thu gọn",
  "Fold line": "Thu gọn dòng",
  "Unfold line": "Mở dòng thu gọn",
  "current match": "Kết quả hiện tại",
  "on line": "tại dòng",
  "replaced match on line $": "Đã thay kết quả tại dòng $",
  "replaced $ matches": "Đã thay $ kết quả",
};

export interface JsonCodeEditorProps {
  value: string;
  label: string;
  formId: string;
  onChange(value: string): void;
  onCursor?(offset: number): void;
  reveal?: { from: number; to: number; revision: number };
}

/** Controlled JSON editor. External changes preserve the unaffected cursor and undo history. */
export function JsonCodeEditor(props: JsonCodeEditorProps) {
  const { t, locale } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const current = useRef(props);
  const phrases = () =>
    EditorState.phrases.of(
      Object.fromEntries(
        Object.entries(codePhraseKeys).map(([key, label]) => [
          key,
          translate.current(label),
        ]),
      ),
    );
  const translate = useRef(t);
  translate.current = t;
  const attributes = useRef(new Compartment());
  const lastReveal = useRef<number | undefined>(undefined);
  current.current = props;
  useEffect(() => {
    const complete = (context: CompletionContext) => {
      const word = context.matchBefore(/[\w.]*/);
      if (!word || (!word.text && !context.explicit)) return null;
      const source = context.state.doc.toString();
      const candidates = codeCompletions(source, context.pos);
      const node = codeNodeAt(source, context.pos);
      const isString = node?.type === "string";
      const from = isString ? node.offset + 1 : word.from;
      const to = isString ? node.offset + node.length - 1 : context.pos;
      const property = getLocation(source, context.pos).isAtPropertyKey;
      return {
        from,
        to,
        options: candidates.map((label) => ({
          label,
          type: property ? "property" : "enum",
          apply: isString
            ? label
            : JSON.stringify(label) + (property ? ": " : ""),
        })),
        validFor: /[\w.]*/,
      };
    };
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: current.current.value,
        extensions: [
          basicSetup,
          json(),
          attributes.current.of([
            phrases(),
            EditorView.contentAttributes.of({
              "aria-label": current.current.label,
              "aria-multiline": "true",
              spellcheck: "false",
            }),
          ]),
          Prec.highest(keymap.of([{ key: "Tab", run: acceptCompletion }])),
          autocompletion({ override: [complete], interactionDelay: 0 }),
          linter(
            (v) =>
              analyzeFormCode(
                v.state.doc.toString(),
                current.current.formId,
              ).problems.map((p) => ({
                from: Math.min(p.from, v.state.doc.length),
                to: Math.min(p.to, v.state.doc.length),
                severity: "error",
                message: translate.current(p.message, p.params),
              })),
            { delay: 250 },
          ),
          syntaxHighlighting(
            HighlightStyle.define([
              { tag: tags.propertyName, color: "var(--fd-color-brand)" },
              { tag: tags.string, color: "var(--fd-status-success)" },
              {
                tag: [tags.number, tags.bool, tags.null],
                color: "var(--fd-status-warning)",
              },
            ]),
          ),
          EditorView.theme({
            "&": {
              height: "100%",
              backgroundColor: "var(--fd-surface-default)",
              color: "var(--fd-text-primary)",
            },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
              fontSize: "12px",
              lineHeight: "18px",
            },
            ".cm-content": { caretColor: "var(--fd-text-primary)" },
            ".cm-gutters, .cm-tooltip": {
              backgroundColor: "var(--fd-surface-raised)",
              color: "var(--fd-text-muted)",
              borderColor: "var(--fd-border)",
            },
            ".cm-activeLine, .cm-activeLineGutter": {
              backgroundColor:
                "color-mix(in srgb, var(--fd-color-brand) 8%, transparent)",
            },
            "&.cm-focused": {
              outline: "2px solid var(--fd-focus-ring)",
              outlineOffset: "-2px",
            },
            ".cm-cursor": { borderLeftColor: "var(--fd-text-primary)" },
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
              backgroundColor:
                "color-mix(in srgb, var(--fd-color-brand) 22%, transparent)",
            },
          }),
          EditorView.updateListener.of((update) => {
            const external = update.transactions.some((tr) =>
              tr.annotation(Transaction.remote),
            );
            if (update.docChanged && !external)
              current.current.onChange(update.state.doc.toString());
            if (update.selectionSet && !external)
              current.current.onCursor?.(update.state.selection.main.head);
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    editor.dispatch({
      effects: attributes.current.reconfigure([
        phrases(),
        EditorView.contentAttributes.of({
          "aria-label": props.label,
          "aria-multiline": "true",
          spellcheck: "false",
        }),
      ]),
    });
    forceLinting(editor);
  }, [locale, props.label]);
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const old = editor.state.doc.toString();
    if (old === props.value) return;
    let from = 0;
    while (
      from < old.length &&
      from < props.value.length &&
      old[from] === props.value[from]
    )
      from++;
    let tail = 0;
    while (
      tail < old.length - from &&
      tail < props.value.length - from &&
      old[old.length - 1 - tail] === props.value[props.value.length - 1 - tail]
    )
      tail++;
    editor.dispatch({
      changes: {
        from,
        to: old.length - tail,
        insert: props.value.slice(from, props.value.length - tail),
      },
      annotations: Transaction.remote.of(true),
    });
  }, [props.value]);
  useEffect(() => {
    if (
      !props.reveal ||
      !view.current ||
      lastReveal.current === props.reveal.revision
    )
      return;
    lastReveal.current = props.reveal.revision;
    const from = Math.min(props.reveal.from, view.current.state.doc.length);
    view.current.dispatch({
      selection: { anchor: from },
      effects: EditorView.scrollIntoView(from, { y: "center" }),
      annotations: Transaction.remote.of(true),
    });
  }, [props.reveal]);
  return <div className="fd-json-code-editor" ref={host} />;
}
