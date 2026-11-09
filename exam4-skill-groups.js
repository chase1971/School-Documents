// Exam 4 skill groups — edit exam4-skill-groups.json, then run
// python harvest/write_exam4_skill_groups.py
const SKILL_GROUPS = {
  "excludedNote": "Left out Riemann sums / area approximation, geometry-only definite integrals, and pure integral-properties problems (no antiderivative to find).",
  "excludedIds": [
    "5.1.24",
    "5.1.29",
    "5.1.33",
    "5.2.22",
    "5.2.40",
    "5.2.41",
    "5.2.43",
    "5.2.53",
    "5.2.55"
  ],
  "blocks": [
    {
      "id": "basic",
      "title": "Basic antiderivatives (4.9 / 5.3 / 5.4)",
      "blurb": "No u-substitution. Grouped by the main rewrite or form you need.",
      "groups": [
        {
          "id": "trig",
          "label": "Trig functions",
          "hint": "sin / cos antiderivatives",
          "ids": [
            "4.9.13",
            "5.3.24",
            "5.3.46"
          ]
        },
        {
          "id": "constant",
          "label": "Constant function",
          "hint": "Antiderivative is linear",
          "ids": [
            "4.9.22"
          ]
        },
        {
          "id": "polynomial",
          "label": "Polynomial / plain power rule",
          "hint": "Sum of integer powers, no rewrite needed",
          "ids": [
            "5.3.25",
            "5.3.37"
          ]
        },
        {
          "id": "negative-exp",
          "label": "Negative exponents",
          "hint": "Rewrite 1/x^n or a/x^n as a power before integrating",
          "ids": [
            "4.9.17",
            "4.9.26",
            "5.3.28",
            "5.3.39"
          ]
        },
        {
          "id": "rational-exp",
          "label": "Rational / fractional exponents",
          "hint": "Roots written as x^{p/q}",
          "ids": [
            "4.9.29",
            "5.3.33"
          ]
        },
        {
          "id": "split-fraction",
          "label": "Split a quotient into separate terms",
          "hint": "Divide term-by-term, then integrate each piece",
          "ids": [
            "4.9.35",
            "5.3.36"
          ]
        },
        {
          "id": "expand-product",
          "label": "Expand a product first",
          "hint": "FOIL / distribute, then power rule",
          "ids": [
            "4.9.31",
            "5.3.41"
          ]
        },
        {
          "id": "ln",
          "label": "Natural log forms",
          "hint": "\u222b 1/x or constant over linear-in-x",
          "ids": [
            "4.9.51",
            "5.3.69"
          ]
        },
        {
          "id": "exp",
          "label": "Exponential",
          "hint": "\u222b e^x",
          "ids": [
            "5.3.50"
          ]
        },
        {
          "id": "inverse-trig",
          "label": "Inverse trig antiderivatives",
          "hint": "arcsin / arctan forms",
          "ids": [
            "5.3.42",
            "5.4.27"
          ]
        },
        {
          "id": "symmetry",
          "label": "Symmetry shortcut",
          "hint": "Even/odd to drop terms before integrating",
          "ids": [
            "5.4.17"
          ]
        },
        {
          "id": "ftc1",
          "label": "FTC: derivative of an integral",
          "hint": "d/dx of \u222b from a to g(x)",
          "ids": [
            "5.3.77"
          ]
        }
      ]
    },
    {
      "id": "usub",
      "title": "5.5 Substitution (separate)",
      "blurb": "All of these need a u-sub. Split by what kind of sub it is.",
      "groups": [
        {
          "id": "usub-power",
          "label": "Power of an algebraic expression",
          "hint": "u = inside, du matches the front factor (often 2x dx)",
          "ids": [
            "5.5.17",
            "5.5.48"
          ]
        },
        {
          "id": "usub-root",
          "label": "Root / radical in the composition",
          "hint": "u involves \u221ax or similar",
          "ids": [
            "5.5.20"
          ]
        },
        {
          "id": "usub-log",
          "label": "Log form \u222b du/u",
          "hint": "Linear denominator after identifying u",
          "ids": [
            "5.5.22"
          ]
        },
        {
          "id": "usub-invtrig",
          "label": "Inverse-trig form after rewrite",
          "hint": "\u221a(a\u00b2 \u2212 (bx)\u00b2) style",
          "ids": [
            "5.5.25"
          ]
        },
        {
          "id": "usub-trig",
          "label": "Trig substitution factor",
          "hint": "u = sin or cos; other factor is du",
          "ids": [
            "5.5.24",
            "5.5.51"
          ]
        },
        {
          "id": "usub-exp",
          "label": "Exponential composition",
          "hint": "e^{ax} in numerator and denominator",
          "ids": [
            "5.5.44"
          ]
        },
        {
          "id": "usub-extra",
          "label": "Extra algebra (rewrite x in terms of u)",
          "hint": "Substitution alone is not enough; expand or back-substitute carefully",
          "ids": [
            "5.5.79",
            "5.5.81"
          ]
        }
      ]
    }
  ]
};
