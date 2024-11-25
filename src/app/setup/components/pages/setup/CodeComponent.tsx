import * as React from "react";
import {useMemo, useRef, useState} from "react";
import {Completion, CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {appStore} from "../../../store/AppStore";
import {Identifier, parse} from "acorn";
import * as acornWalk from "acorn-walk";
import CodeEditor from "../../CodeEditor";

export const CodeComponent = (props: {code: string, onCodeUpdate:(code: string) => void}) => {
    const codeRef = useRef(null)
    const [identifiers, setIdentifiers] = useState([])

    function setCode(code: string) {
        props.onCodeUpdate(code)
    }

    useMemo(() => {
        let identifiers = []
        const scriptsById = appStore.getState().profile.scripts.entities
        const scripts = Object.values(scriptsById).map((it) => it.code)
        scripts.forEach((script) => {
            try {
                const ast = parse(script, {
                    ecmaVersion: "latest",
                    sourceType: 'script'
                });

                // Recursive function to process object expressions
                const processObjectExpression = (basePath, node) => {
                    node.properties.forEach(prop => {
                        if (prop.type === "Property" && prop.key.type === 'Identifier') {
                            const fullPath = basePath ? `${basePath}.${prop.key.name}` : prop.key.name;

                            // Add the current property path
                            identifiers.push(fullPath);

                            // Recursively process nested objects
                            if (prop.value.type === 'ObjectExpression') {
                                processObjectExpression(fullPath, prop.value);
                            }
                        }
                    });
                };

                acornWalk.simple(ast, {
                    VariableDeclarator(node) {
                        const varName = (node.id as Identifier).name;
                        // Add the base variable name
                        identifiers.push(varName);

                        // Process object initialization
                        if (node.init?.type === 'ObjectExpression') {
                            processObjectExpression(varName, node.init);
                        }
                    },
                    FunctionDeclaration(node) {
                        identifiers.push(node.id.name);
                    }
                });
            } catch (ex) {
                console.error(ex);
            }
        });

        setIdentifiers(identifiers)
    }, []);

    function customCompletionSource(context: CompletionContext): CompletionResult | null {
        const word = context.matchBefore(/\w+(\.\w*)*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        const input = word.text;
        const hasDot = input.includes('.');

        let options: Completion[] = [];

        if (hasDot) {
            // Handle nested property access
            const parts = input.split('.');
            const base = parts.slice(0, -1).join('.');
            const currentInput = parts[parts.length - 1];

            const suggestions = new Map<string, string>();

            identifiers.forEach(id => {
                // Match identifiers starting with base + .
                if (id.startsWith(`${base}.`)) {
                    const remaining = id.slice(base.length + 1);
                    const nextSegment = remaining.split('.')[0];

                    // Only show first-level nested properties
                    if (nextSegment.startsWith(currentInput)) {
                        const fullPath = `${base}.${nextSegment}`;
                        suggestions.set(nextSegment, fullPath);
                    }
                }
            });

            options = Array.from(suggestions.entries()).map(([label, apply]) => ({
                label,
                type: 'property',
                apply: apply // Insert full path when selected
            }));
        } else {
            // Handle top-level identifiers
            options = identifiers
                .filter(id =>
                    // Only show identifiers that:
                    // 1. Start with current input
                    // 2. Are either base objects or non-nested identifiers
                    id.startsWith(input) &&
                    (id === input || !id.slice(input.length).includes('.'))
                )
                .map(id => ({
                    label: id.split('.')[0], // Show only base name
                    type: 'variable',
                    apply: id.split('.')[0] // Insert base name
                }));
        }

        return {
            from: word.from,
            options,
            filter: false
        };
    }

    return (
        <div>
            <CodeEditor
                ref={codeRef}
                value={props.code}
                isJs={true}
                additionalCompletitionSource={customCompletionSource}
                onChange={(value) => {
                    setCode(value)
                }}/>
        </div>
    );
}