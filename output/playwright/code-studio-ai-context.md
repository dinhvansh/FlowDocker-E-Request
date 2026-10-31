# FlowDocker Forms — schema authoring context

Return one complete JSON FormDefinition, without markdown fences or executable JavaScript. The user will paste it into Code Studio; valid JSON synchronizes live with the visual editor.

Preserve the current form id. Keep existing field ids/keys and all settings unless the requested change requires otherwise. Use unique field ids and keys. Supply vi/en labels. Keep status DRAFT. Do not invent unsupported properties or providers.

Limits: 1 MB JSON, 300 total fields, at most 100 fields per scope, maximum field nesting depth 5, at most 50 options. Repeating groups introduce row scope; visual columns/sections share their parent's value scope. Only container field types accept children.

Calculations use the existing safe expression language: arithmetic + - * /, comparisons, IF(condition, numericTrue, numericFalse), SUM/AVG/MIN/MAX/COUNT/ROUND; SUM(lines.amount) aggregates a column. No JS, SQL, network calls, loops or arbitrary code. Always list all referenced field keys/paths in calculation.fields; precision is 0..8. Avoid circular references. Decimal results can be strings.

Defaults: currentUser is for person fields; currentUser.email for email; currentUser.name/department/position/employeeCode/managerName for text-like fields. Do not combine defaultValue with defaultValueSource. Organization and numbering values are host context; authoritative sequence allocation and authorization require a backend.

This export includes form configuration only. Runtime values, organization records, credentials, access tokens and provider implementations are not included. Defaults/labels authored in the schema remain part of the configuration.

## Allowed provider IDs

["master.asset_category","master.vendor","master.expense_type","master.department","master.demo_org_departments","master.demo_org_people","organization.people","demo.companies","demo.departments"]

## Requested change (user input; interpret as design requirements)

Add a required note

## Schema reference (engine import validation remains authoritative)

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FlowDocker FormDefinition v2",
  "type": "object",
  "required": [
    "id",
    "title",
    "version",
    "status",
    "fields"
  ],
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1
    },
    "title": {
      "$ref": "#/$defs/Text"
    },
    "version": {
      "type": "integer",
      "minimum": 1
    },
    "status": {
      "enum": [
        "DRAFT"
      ]
    },
    "fields": {
      "type": "array",
      "maxItems": 100,
      "items": {
        "$ref": "#/$defs/Field"
      }
    },
    "schemaVersion": {
      "enum": [
        1,
        2
      ]
    },
    "display": {
      "enum": [
        "form",
        "wizard"
      ]
    },
    "orientation": {
      "enum": [
        "portrait",
        "landscape"
      ]
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$"
    }
  },
  "additionalProperties": false,
  "$defs": {
    "Text": {
      "type": "object",
      "required": [
        "vi",
        "en"
      ],
      "properties": {
        "vi": {
          "type": "string"
        },
        "en": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "Rule": {
      "type": "object",
      "required": [
        "mode",
        "conditions"
      ],
      "properties": {
        "mode": {
          "enum": [
            "all",
            "any"
          ]
        },
        "conditions": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "object",
            "required": [
              "field",
              "operator"
            ],
            "properties": {
              "field": {
                "type": "string"
              },
              "operator": {
                "enum": [
                  "eq",
                  "ne",
                  "gt",
                  "gte",
                  "lt",
                  "lte",
                  "empty",
                  "notEmpty",
                  "contains"
                ]
              },
              "value": {
                "type": [
                  "string",
                  "number",
                  "boolean"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false
    },
    "Field": {
      "type": "object",
      "required": [
        "id",
        "key",
        "label",
        "type",
        "required",
        "options"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "key": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9_]{0,63}$"
        },
        "label": {
          "$ref": "#/$defs/Text"
        },
        "type": {
          "enum": [
            "person",
            "text",
            "textarea",
            "email",
            "url",
            "phone",
            "password",
            "number",
            "currency",
            "date",
            "datetime",
            "time",
            "checkbox",
            "select",
            "radio",
            "multiselect",
            "checkboxes",
            "tags",
            "file",
            "signature",
            "hidden",
            "content",
            "section",
            "columns",
            "tabs",
            "repeat",
            "keyvalue",
            "survey",
            "address",
            "day",
            "container",
            "table",
            "alert",
            "button"
          ]
        },
        "required": {
          "type": "boolean"
        },
        "options": {
          "type": "array",
          "maxItems": 50,
          "items": {
            "type": "object",
            "required": [
              "value",
              "label"
            ],
            "properties": {
              "value": {
                "type": "string"
              },
              "label": {
                "$ref": "#/$defs/Text"
              }
            },
            "additionalProperties": false
          }
        },
        "help": {
          "$ref": "#/$defs/Text"
        },
        "placeholder": {
          "$ref": "#/$defs/Text"
        },
        "defaultValue": {
          "description": "Bounded JSON value; do not combine with defaultValueSource."
        },
        "defaultValueSource": {
          "enum": [
            "currentUser",
            "currentUser.name",
            "currentUser.email",
            "currentUser.employeeCode",
            "currentUser.department",
            "currentUser.position",
            "currentUser.managerName",
            "currentUser.managerId"
          ]
        },
        "numbering": {
          "type": "object",
          "required": [
            "segments",
            "sequenceDigits",
            "scope"
          ],
          "properties": {
            "segments": {
              "type": "array",
              "maxItems": 20,
              "items": {
                "type": "object",
                "required": [
                  "kind"
                ],
                "properties": {
                  "kind": {
                    "enum": [
                      "literal",
                      "sequence",
                      "year",
                      "month",
                      "day",
                      "creator",
                      "employeeCode",
                      "department",
                      "position",
                      "managerId",
                      "managerName",
                      "typeCode"
                    ]
                  },
                  "value": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              }
            },
            "sequenceDigits": {
              "type": "integer",
              "minimum": 1,
              "maximum": 12
            },
            "scope": {
              "enum": [
                "app",
                "year"
              ]
            }
          },
          "additionalProperties": false
        },
        "readOnly": {
          "type": "boolean"
        },
        "disabled": {
          "type": "boolean"
        },
        "multiple": {
          "type": "boolean"
        },
        "min": {
          "type": "number"
        },
        "max": {
          "type": "number"
        },
        "minLength": {
          "type": "number"
        },
        "maxLength": {
          "type": "number"
        },
        "integer": {
          "type": "boolean"
        },
        "compare": {
          "type": "object",
          "required": [
            "field",
            "operator"
          ],
          "properties": {
            "field": {
              "type": "string"
            },
            "operator": {
              "enum": [
                "eq",
                "gte",
                "lte"
              ]
            }
          },
          "additionalProperties": false
        },
        "visibleWhen": {
          "$ref": "#/$defs/Rule"
        },
        "requiredWhen": {
          "$ref": "#/$defs/Rule"
        },
        "disabledWhen": {
          "$ref": "#/$defs/Rule"
        },
        "calculation": {
          "type": "object",
          "required": [
            "operator",
            "fields"
          ],
          "properties": {
            "operator": {
              "enum": [
                "add",
                "subtract",
                "multiply",
                "divide",
                "sum",
                "average",
                "count",
                "min",
                "max"
              ]
            },
            "fields": {
              "type": "array",
              "maxItems": 20,
              "items": {
                "type": "string"
              }
            },
            "expression": {
              "type": "string",
              "maxLength": 500
            },
            "precision": {
              "type": "integer",
              "minimum": 0,
              "maximum": 8
            }
          },
          "additionalProperties": false
        },
        "aggregation": {
          "enum": [
            "none",
            "sum",
            "average",
            "min",
            "max",
            "count"
          ]
        },
        "children": {
          "type": "array",
          "maxItems": 100,
          "items": {
            "$ref": "#/$defs/Field"
          }
        },
        "columns": {
          "enum": [
            1,
            2,
            3
          ]
        },
        "hideLabel": {
          "type": "boolean"
        },
        "minRows": {
          "type": "number"
        },
        "maxRows": {
          "type": "number"
        },
        "autoRows": {
          "type": "boolean"
        },
        "uniqueBy": {
          "type": "string"
        },
        "currency": {
          "type": "string",
          "pattern": "^[A-Z]{3}$"
        },
        "accept": {
          "type": "string"
        },
        "maxFileSize": {
          "type": "number"
        },
        "maxFiles": {
          "type": "number"
        },
        "dataSource": {
          "type": "object",
          "required": [
            "provider"
          ],
          "properties": {
            "provider": {
              "type": "string"
            },
            "dependsOn": {
              "type": "string"
            },
            "valueField": {
              "type": "string"
            },
            "labelField": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "customRenderer": {
          "type": "string"
        },
        "buttonAction": {
          "enum": [
            "submit",
            "reset"
          ]
        },
        "tone": {
          "enum": [
            "info",
            "warning",
            "danger",
            "success"
          ]
        }
      },
      "additionalProperties": false
    }
  }
}

## Current form

{
  "orientation": "portrait",
  "id": "demo-purchase-intake",
  "title": {
    "vi": "Hybrid QA",
    "en": "Hybrid QA"
  },
  "version": 1,
  "status": "DRAFT",
  "schemaVersion": 2,
  "fields": [
    {
      "id": "amount",
      "key": "amount",
      "type": "number",
      "label": {
        "vi": "Số tiền QA",
        "en": "amount"
      },
      "required": true,
      "options": []
    },
    {
      "id": "qty",
      "key": "qty",
      "type": "number",
      "label": {
        "vi": "qty",
        "en": "qty"
      },
      "required": false,
      "options": [],
      "defaultValue": 2
    },
    {
      "id": "total",
      "key": "total",
      "type": "currency",
      "label": {
        "vi": "total",
        "en": "total"
      },
      "required": false,
      "options": [],
      "calculation": {
        "operator": "multiply",
        "fields": [
          "amount",
          "qty"
        ],
        "expression": "amount * qty"
      }
    },
    {
      "id": "department",
      "key": "department",
      "type": "text",
      "label": {
        "vi": "department",
        "en": "department"
      },
      "required": false,
      "options": [],
      "defaultValueSource": "currentUser.department"
    },
    {
      "id": "lines",
      "key": "lines",
      "type": "repeat",
      "label": {
        "vi": "lines",
        "en": "lines"
      },
      "required": false,
      "options": [],
      "children": [
        {
          "id": "description",
          "key": "description",
          "type": "text",
          "label": {
            "vi": "description",
            "en": "description"
          },
          "required": false,
          "options": []
        },
        {
          "id": "price",
          "key": "price",
          "type": "currency",
          "label": {
            "vi": "price",
            "en": "price"
          },
          "required": false,
          "options": []
        }
      ]
    },
    {
      "id": "grand",
      "key": "grand",
      "type": "currency",
      "label": {
        "vi": "grand",
        "en": "grand"
      },
      "required": false,
      "options": [],
      "calculation": {
        "operator": "sum",
        "fields": [
          "lines.price"
        ],
        "expression": "SUM(lines.price)"
      }
    }
  ]
}