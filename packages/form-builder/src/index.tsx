export * from "./schema";
export { documentFieldOrder, toggleDocumentRegion } from "./document-regions";
export type { DocumentRegion } from "./document-regions";
export { defaultDecoration, validFormDecoration } from "./decoration";
export type { FormDecoration, FormBand, FormBandCell } from "./decoration";
export { FormBandView } from "./components/form-band";
export { FormDecorationEditor } from "./components/form-decoration-editor";
export type { FormDecorationEditorProps } from "./components/form-decoration-editor";
export { spacingStyle, compactSpacing, standardSpacing } from "./spacing";
export { FormSpacingEditor } from "./components/form-spacing-editor";
export type { FormSpacingEditorProps } from "./components/form-spacing-editor";
export * from "./engine";
export { fieldConfiguration } from "./field-configuration";
export type {
  ConfigurationKind,
  ConfigurationSection,
} from "./field-configuration";
export { createShowcaseDefinition } from "./showcase";
export { FormDesigner, moveField } from "./designer";
export type { FormDesignerProps } from "./designer";
export { DataSourceEditor } from "./components/data-source-editor";
export type { FormDataSource } from "./components/data-source-editor";
export { FormRenderer, FormPreview } from "./runtime";
export type {
  FormRendererProps,
  FormPreviewProps,
  ChoiceOption,
  DataProvider,
  FileReference,
  UploadHandler,
  CustomControlProps,
} from "./runtime";

export { FormCanvas } from "./canvas";
export type { FormCanvasProps } from "./canvas";

export { createPaymentDefinition } from "./payment-example";
export { FieldInspector } from "./components/field-inspector";
export type {
  FieldInspectorProps,
  InspectorSection,
} from "./components/field-inspector";

export { FormTestPreview, parseTestValues } from "./test-preview";
export { ContentBlock } from "./components/content-block";
export {
  ContentBlockEditor,
  type ContentBlockEditorProps,
} from "./components/content-block-editor";
export { type FormBlockPresentation } from "./decoration";
export {
  EditableFormTitle,
  type EditableFormTitleProps,
} from "./components/editable-form-title";

export {
  FormSchemaIssues,
  type FormSchemaIssuesProps,
} from "./components/form-schema-issues";

export {
  FieldIssueBadge,
  type FieldIssueBadgeProps,
} from "./components/field-issue-badge";

export { FormLogicStudio } from "./logic-studio";
export type { FormLogicStudioProps } from "./logic-studio";
export { logicInventory, hasLogic } from "./logic-model";
export type { LogicNode } from "./logic-model";

export { ColumnLayoutEditor } from "./components/column-layout-editor";
export type { ColumnLayoutEditorProps } from "./components/column-layout-editor";
export {
  columnStyle,
  columnPercentages,
  resizeColumns,
  validColumnRatios,
} from "./column-layout";

export { DirectContentEditor } from "./components/direct-content-editor";
export type {
  DirectContentEditorProps,
  ContentDesign,
} from "./components/direct-content-editor";
export {
  contentPosition,
  contentPresentation,
  movedContent,
  resizedContent,
} from "./content-position";
