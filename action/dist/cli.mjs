import { createRequire as __qdCreateRequire } from 'node:module'; const require = __qdCreateRequire(import.meta.url);

// src/cli.ts
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join as join2, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// src/node.ts
import { readFile, readdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, relative, sep } from "node:path";

// scripts/wasm-files.mjs
var WASM_FILES = {
  "web-tree-sitter.wasm": "web-tree-sitter/web-tree-sitter.wasm",
  "tree-sitter-python.wasm": "tree-sitter-python/tree-sitter-python.wasm",
  "tree-sitter-javascript.wasm": "tree-sitter-javascript/tree-sitter-javascript.wasm",
  "tree-sitter-typescript.wasm": "tree-sitter-typescript/tree-sitter-typescript.wasm",
  "tree-sitter-tsx.wasm": "tree-sitter-typescript/tree-sitter-tsx.wasm",
  "tree-sitter-java.wasm": "tree-sitter-java/tree-sitter-java.wasm",
  "tree-sitter-go.wasm": "tree-sitter-go/tree-sitter-go.wasm"
};

// ../../node_modules/.pnpm/web-tree-sitter@0.27.1/node_modules/web-tree-sitter/web-tree-sitter.js
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var Edit = class {
  static {
    __name(this, "Edit");
  }
  /** The start position of the change. */
  startPosition;
  /** The end position of the change before the edit. */
  oldEndPosition;
  /** The end position of the change after the edit. */
  newEndPosition;
  /** The start index of the change. */
  startIndex;
  /** The end index of the change before the edit. */
  oldEndIndex;
  /** The end index of the change after the edit. */
  newEndIndex;
  constructor({
    startIndex,
    oldEndIndex,
    newEndIndex,
    startPosition,
    oldEndPosition,
    newEndPosition
  }) {
    this.startIndex = startIndex >>> 0;
    this.oldEndIndex = oldEndIndex >>> 0;
    this.newEndIndex = newEndIndex >>> 0;
    this.startPosition = startPosition;
    this.oldEndPosition = oldEndPosition;
    this.newEndPosition = newEndPosition;
  }
  /**
   * Edit a point and index to keep it in-sync with source code that has been edited.
   *
   * This function updates a single point's byte offset and row/column position
   * based on an edit operation. This is useful for editing points without
   * requiring a tree or node instance.
   */
  editPoint(point, index) {
    let newIndex = index;
    const newPoint = { ...point };
    if (index >= this.oldEndIndex) {
      newIndex = this.newEndIndex + (index - this.oldEndIndex);
      const originalRow = point.row;
      newPoint.row = this.newEndPosition.row + (point.row - this.oldEndPosition.row);
      newPoint.column = originalRow === this.oldEndPosition.row ? this.newEndPosition.column + (point.column - this.oldEndPosition.column) : point.column;
    } else if (index > this.startIndex) {
      newIndex = this.newEndIndex;
      newPoint.row = this.newEndPosition.row;
      newPoint.column = this.newEndPosition.column;
    }
    return { point: newPoint, index: newIndex };
  }
  /**
   * Edit a range to keep it in-sync with source code that has been edited.
   *
   * This function updates a range's start and end positions based on an edit
   * operation. This is useful for editing ranges without requiring a tree
   * or node instance.
   */
  editRange(range) {
    const newRange = {
      startIndex: range.startIndex,
      startPosition: { ...range.startPosition },
      endIndex: range.endIndex,
      endPosition: { ...range.endPosition }
    };
    if (range.endIndex >= this.oldEndIndex) {
      if (range.endIndex !== Number.MAX_SAFE_INTEGER) {
        newRange.endIndex = this.newEndIndex + (range.endIndex - this.oldEndIndex);
        newRange.endPosition = {
          row: this.newEndPosition.row + (range.endPosition.row - this.oldEndPosition.row),
          column: range.endPosition.row === this.oldEndPosition.row ? this.newEndPosition.column + (range.endPosition.column - this.oldEndPosition.column) : range.endPosition.column
        };
        if (newRange.endIndex < this.newEndIndex) {
          newRange.endIndex = Number.MAX_SAFE_INTEGER;
          newRange.endPosition = { row: Number.MAX_SAFE_INTEGER, column: Number.MAX_SAFE_INTEGER };
        }
      }
    } else if (range.endIndex > this.startIndex) {
      newRange.endIndex = this.startIndex;
      newRange.endPosition = { ...this.startPosition };
    }
    if (range.startIndex >= this.oldEndIndex) {
      newRange.startIndex = this.newEndIndex + (range.startIndex - this.oldEndIndex);
      newRange.startPosition = {
        row: this.newEndPosition.row + (range.startPosition.row - this.oldEndPosition.row),
        column: range.startPosition.row === this.oldEndPosition.row ? this.newEndPosition.column + (range.startPosition.column - this.oldEndPosition.column) : range.startPosition.column
      };
      if (newRange.startIndex < this.newEndIndex) {
        newRange.startIndex = Number.MAX_SAFE_INTEGER;
        newRange.startPosition = { row: Number.MAX_SAFE_INTEGER, column: Number.MAX_SAFE_INTEGER };
      }
    } else if (range.startIndex > this.startIndex) {
      newRange.startIndex = this.startIndex;
      newRange.startPosition = { ...this.startPosition };
    }
    return newRange;
  }
};
var SIZE_OF_SHORT = 2;
var SIZE_OF_INT = 4;
var SIZE_OF_CURSOR = 4 * SIZE_OF_INT;
var SIZE_OF_NODE = 5 * SIZE_OF_INT;
var SIZE_OF_POINT = 2 * SIZE_OF_INT;
var SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT;
var ZERO_POINT = { row: 0, column: 0 };
var INTERNAL = /* @__PURE__ */ Symbol("INTERNAL");
function assertInternal(x) {
  if (x !== INTERNAL) throw new Error("Illegal constructor");
}
__name(assertInternal, "assertInternal");
function isPoint(point) {
  return !!point && typeof point.row === "number" && typeof point.column === "number";
}
__name(isPoint, "isPoint");
function setModule(module2) {
  C = module2;
}
__name(setModule, "setModule");
var C;
function newFinalizer(handler) {
  try {
    return new FinalizationRegistry(handler);
  } catch (e) {
    console.error("Unsupported FinalizationRegistry:", e);
    return;
  }
}
__name(newFinalizer, "newFinalizer");
var finalizer = newFinalizer((address) => {
  C._ts_lookahead_iterator_delete(address);
});
var LookaheadIterator = class {
  static {
    __name(this, "LookaheadIterator");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  language;
  /** @internal */
  positioned = false;
  /** @internal */
  constructor(internal, address, language) {
    assertInternal(internal);
    this[0] = address;
    this.language = language;
    finalizer?.register(this, address, this);
  }
  /**
   * Get the current symbol of the lookahead iterator.
   *
   * Returns `null` if the iterator is not positioned on a symbol:
   *
   * - Before the first iteration step
   * - After the iterator is exhausted
   * - After a {@link reset} or {@link resetState} call
   */
  get currentTypeId() {
    return this.positioned ? C._ts_lookahead_iterator_current_symbol(this[0]) : null;
  }
  /**
   * Get the current symbol name of the lookahead iterator.
   *
   * Returns `null` if the iterator is not positioned on a symbol.
   */
  get currentType() {
    const id = this.currentTypeId;
    if (id === null) return null;
    return this.language.types[id] ?? C.UTF8ToString(C._ts_language_symbol_name(this.language[0], id));
  }
  /** Delete the lookahead iterator, freeing its resources. */
  delete() {
    finalizer?.unregister(this);
    C._ts_lookahead_iterator_delete(this[0]);
    this[0] = 0;
  }
  /**
   * Reset the lookahead iterator.
   *
   * This returns `true` if the language was set successfully and `false`
   * otherwise.
   */
  reset(language, stateId) {
    if (C._ts_lookahead_iterator_reset(this[0], language[0], stateId)) {
      this.language = language;
      this.positioned = false;
      return true;
    }
    return false;
  }
  /**
   * Reset the lookahead iterator to another state.
   *
   * This returns `true` if the iterator was reset to the given state and
   * `false` otherwise.
   */
  resetState(stateId) {
    if (!C._ts_lookahead_iterator_reset_state(this[0], stateId)) return false;
    this.positioned = false;
    return true;
  }
  /**
   * Returns an iterator that iterates over the symbols of the lookahead iterator.
   *
   * The iterator will yield the current symbol name as a string for each step
   * until there are no more symbols to iterate over.
   */
  [Symbol.iterator]() {
    return {
      next: /* @__PURE__ */ __name(() => {
        this.positioned = Boolean(C._ts_lookahead_iterator_next(this[0]));
        const value = this.currentType;
        return value === null ? { done: true, value: "" } : { done: false, value };
      }, "next")
    };
  }
};
function getText(tree, startIndex, endIndex, startPosition) {
  const length = endIndex - startIndex;
  let result = tree.textCallback(startIndex, startPosition);
  if (result) {
    startIndex += result.length;
    while (startIndex < endIndex) {
      const string = tree.textCallback(startIndex, startPosition);
      if (string && string.length > 0) {
        startIndex += string.length;
        result += string;
      } else {
        break;
      }
    }
    if (startIndex > endIndex) {
      result = result.slice(0, length);
    }
  }
  return result ?? "";
}
__name(getText, "getText");
var finalizer2 = newFinalizer((address) => {
  C._ts_tree_delete(address);
});
var Tree = class _Tree {
  static {
    __name(this, "Tree");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  textCallback;
  /** The language that was used to parse the syntax tree. */
  language;
  /** @internal */
  constructor(internal, address, language, textCallback) {
    assertInternal(internal);
    this[0] = address;
    this.language = language;
    this.textCallback = textCallback;
    finalizer2?.register(this, address, this);
  }
  /** Create a shallow copy of the syntax tree. This is very fast. */
  copy() {
    const address = C._ts_tree_copy(this[0]);
    return new _Tree(INTERNAL, address, this.language, this.textCallback);
  }
  /** Delete the syntax tree, freeing its resources. */
  delete() {
    finalizer2?.unregister(this);
    C._ts_tree_delete(this[0]);
    this[0] = 0;
  }
  /** Get the root node of the syntax tree. */
  get rootNode() {
    C._ts_tree_root_node_wasm(this[0]);
    return unmarshalNode(this);
  }
  /**
   * Get the root node of the syntax tree, but with its position shifted
   * forward by the given offset.
   */
  rootNodeWithOffset(offsetBytes, offsetExtent) {
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, offsetBytes, "i32");
    marshalPoint(address + SIZE_OF_INT, offsetExtent);
    C._ts_tree_root_node_with_offset_wasm(this[0]);
    return unmarshalNode(this);
  }
  /**
   * Edit the syntax tree to keep it in sync with source code that has been
   * edited.
   *
   * You must describe the edit both in terms of byte offsets and in terms of
   * row/column coordinates.
   */
  edit(edit) {
    marshalEdit(edit);
    C._ts_tree_edit_wasm(this[0]);
  }
  /** Create a new {@link TreeCursor} starting from the root of the tree. */
  walk() {
    return this.rootNode.walk();
  }
  /**
   * Compare this old edited syntax tree to a new syntax tree representing
   * the same document, returning a sequence of ranges whose syntactic
   * structure has changed.
   *
   * For this to work correctly, this syntax tree must have been edited such
   * that its ranges match up to the new tree. Generally, you'll want to
   * call this method right after calling one of the [`Parser::parse`]
   * functions. Call it on the old tree that was passed to parse, and
   * pass the new tree that was returned from `parse`.
   */
  getChangedRanges(other) {
    if (!(other instanceof _Tree)) {
      throw new TypeError("Argument must be a Tree");
    }
    C._ts_tree_get_changed_ranges_wasm(this[0], other[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
      }
      C._free(buffer);
    }
    return result;
  }
  /** Get the included ranges that were used to parse the syntax tree. */
  getIncludedRanges() {
    C._ts_tree_included_ranges_wasm(this[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
      }
      C._free(buffer);
    }
    return result;
  }
};
var finalizer3 = newFinalizer((address) => {
  C._ts_tree_cursor_delete_wasm(address);
});
var TreeCursor = class _TreeCursor {
  static {
    __name(this, "TreeCursor");
  }
  /** @internal */
  // @ts-expect-error: never read
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  // @ts-expect-error: never read
  [1] = 0;
  // Internal handle for Wasm
  /** @internal */
  // @ts-expect-error: never read
  [2] = 0;
  // Internal handle for Wasm
  /** @internal */
  // @ts-expect-error: never read
  [3] = 0;
  // Internal handle for Wasm
  /** @internal */
  tree;
  /** @internal */
  constructor(internal, tree) {
    assertInternal(internal);
    this.tree = tree;
    unmarshalTreeCursor(this);
    finalizer3?.register(this, this.tree[0], this);
  }
  /** Creates a deep copy of the tree cursor. This allocates new memory. */
  copy() {
    const copy = new _TreeCursor(INTERNAL, this.tree);
    C._ts_tree_cursor_copy_wasm(this.tree[0]);
    unmarshalTreeCursor(copy);
    return copy;
  }
  /** Delete the tree cursor, freeing its resources. */
  delete() {
    finalizer3?.unregister(this);
    marshalTreeCursor(this);
    C._ts_tree_cursor_delete_wasm(this.tree[0]);
    this[0] = this[1] = this[2] = 0;
  }
  /** Get the tree cursor's current {@link Node}. */
  get currentNode() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_current_node_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get the numerical field id of this tree cursor's current node.
   *
   * See also {@link TreeCursor#currentFieldName}.
   */
  get currentFieldId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_field_id_wasm(this.tree[0]);
  }
  /** Get the field name of this tree cursor's current node. */
  get currentFieldName() {
    return this.tree.language.fields[this.currentFieldId];
  }
  /**
   * Get the depth of the cursor's current node relative to the original
   * node that the cursor was constructed with.
   */
  get currentDepth() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_depth_wasm(this.tree[0]);
  }
  /**
   * Get the index of the cursor's current node out of all of the
   * descendants of the original node that the cursor was constructed with.
   */
  get currentDescendantIndex() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_descendant_index_wasm(this.tree[0]);
  }
  /** Get the type of the cursor's current node. */
  get nodeType() {
    return this.tree.language.types[this.nodeTypeId] || "ERROR";
  }
  /** Get the type id of the cursor's current node. */
  get nodeTypeId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0]);
  }
  /** Get the state id of the cursor's current node. */
  get nodeStateId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_state_id_wasm(this.tree[0]);
  }
  /** Get the id of the cursor's current node. */
  get nodeId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_id_wasm(this.tree[0]);
  }
  /**
   * Check if the cursor's current node is *named*.
   *
   * Named nodes correspond to named rules in the grammar, whereas
   * *anonymous* nodes correspond to string literals in the grammar.
   */
  get nodeIsNamed() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if the cursor's current node is *missing*.
   *
   * Missing nodes are inserted by the parser in order to recover from
   * certain kinds of syntax errors.
   */
  get nodeIsMissing() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]) === 1;
  }
  /** Get the string content of the cursor's current node. */
  get nodeText() {
    marshalTreeCursor(this);
    const startIndex = C._ts_tree_cursor_start_index_wasm(this.tree[0]);
    const endIndex = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
    C._ts_tree_cursor_start_position_wasm(this.tree[0]);
    const startPosition = unmarshalPoint(TRANSFER_BUFFER);
    return getText(this.tree, startIndex, endIndex, startPosition);
  }
  /** Get the start position of the cursor's current node. */
  get startPosition() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_start_position_wasm(this.tree[0]);
    return unmarshalPoint(TRANSFER_BUFFER);
  }
  /** Get the end position of the cursor's current node. */
  get endPosition() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_end_position_wasm(this.tree[0]);
    return unmarshalPoint(TRANSFER_BUFFER);
  }
  /** Get the start index of the cursor's current node. */
  get startIndex() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_start_index_wasm(this.tree[0]);
  }
  /** Get the end index of the cursor's current node. */
  get endIndex() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_end_index_wasm(this.tree[0]);
  }
  /**
   * Move this cursor to the first child of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there were no children.
   */
  gotoFirstChild() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the last child of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there were no children.
   *
   * Note that this function may be slower than
   * {@link TreeCursor#gotoFirstChild} because it needs to
   * iterate through all the children to compute the child's position.
   */
  gotoLastChild() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_last_child_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the parent of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there was no parent node (the cursor was already on the
   * root node).
   *
   * Note that the node the cursor was constructed with is considered the root
   * of the cursor, and the cursor cannot walk outside this node.
   */
  gotoParent() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the next sibling of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there was no next sibling node.
   *
   * Note that the node the cursor was constructed with is considered the root
   * of the cursor, and the cursor cannot walk outside this node.
   */
  gotoNextSibling() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the previous sibling of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there was no previous sibling node.
   *
   * Note that this function may be slower than
   * {@link TreeCursor#gotoNextSibling} due to how node
   * positions are stored. In the worst case, this will need to iterate
   * through all the children up to the previous sibling node to recalculate
   * its position. Also note that the node the cursor was constructed with is
   * considered the root of the cursor, and the cursor cannot walk outside this node.
   */
  gotoPreviousSibling() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_previous_sibling_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move the cursor to the node that is the nth descendant of
   * the original node that the cursor was constructed with, where
   * zero represents the original node itself.
   */
  gotoDescendant(goalDescendantIndex) {
    marshalTreeCursor(this);
    C._ts_tree_cursor_goto_descendant_wasm(this.tree[0], goalDescendantIndex);
    unmarshalTreeCursor(this);
  }
  /**
   * Move this cursor to the first child of its current node that contains or
   * starts after the given byte offset.
   *
   * This returns `true` if the cursor successfully moved to a child node, and returns
   * `false` if no such child was found.
   */
  gotoFirstChildForIndex(goalIndex) {
    marshalTreeCursor(this);
    C.setValue(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalIndex, "i32");
    const result = C._ts_tree_cursor_goto_first_child_for_index_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the first child of its current node that contains or
   * starts after the given byte offset.
   *
   * This returns the index of the child node if one was found, and returns
   * `null` if no such child was found.
   */
  gotoFirstChildForPosition(goalPosition) {
    marshalTreeCursor(this);
    marshalPoint(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalPosition);
    const result = C._ts_tree_cursor_goto_first_child_for_position_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Re-initialize this tree cursor to start at the original node that the
   * cursor was constructed with.
   */
  reset(node) {
    marshalNode(node);
    marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE);
    C._ts_tree_cursor_reset_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
  }
  /**
   * Re-initialize a tree cursor to the same position as another cursor.
   *
   * Unlike {@link TreeCursor#reset}, this will not lose parent
   * information and allows reusing already created cursors.
   */
  resetTo(cursor) {
    marshalTreeCursor(this, TRANSFER_BUFFER);
    marshalTreeCursor(cursor, TRANSFER_BUFFER + SIZE_OF_CURSOR);
    C._ts_tree_cursor_reset_to_wasm(this.tree[0], cursor.tree[0]);
    unmarshalTreeCursor(this);
  }
};
var Node = class {
  static {
    __name(this, "Node");
  }
  /** @internal */
  // @ts-expect-error: never read
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  _children;
  /** @internal */
  _namedChildren;
  /** @internal */
  constructor(internal, {
    id,
    tree,
    startIndex,
    startPosition,
    other
  }) {
    assertInternal(internal);
    this[0] = other;
    this.id = id;
    this.tree = tree;
    this.startIndex = startIndex;
    this.startPosition = startPosition;
  }
  /**
   * The numeric id for this node that is unique.
   *
   * Within a given syntax tree, no two nodes have the same id. However:
   *
   * * If a new tree is created based on an older tree, and a node from the old tree is reused in
   *   the process, then that node will have the same id in both trees.
   *
   * * A node not marked as having changes does not guarantee it was reused.
   *
   * * If a node is marked as having changed in the old tree, it will not be reused.
   */
  id;
  /** The byte index where this node starts. */
  startIndex;
  /** The position where this node starts. */
  startPosition;
  /** The tree that this node belongs to. */
  tree;
  /** Get this node's type as a numerical id. */
  get typeId() {
    marshalNode(this);
    return C._ts_node_symbol_wasm(this.tree[0]);
  }
  /**
   * Get the node's type as a numerical id as it appears in the grammar,
   * ignoring aliases.
   */
  get grammarId() {
    marshalNode(this);
    return C._ts_node_grammar_symbol_wasm(this.tree[0]);
  }
  /** Get this node's type as a string. */
  get type() {
    return this.tree.language.types[this.typeId] || "ERROR";
  }
  /**
   * Get this node's symbol name as it appears in the grammar, ignoring
   * aliases as a string.
   */
  get grammarType() {
    return this.tree.language.types[this.grammarId] || "ERROR";
  }
  /**
   * Check if this node is *named*.
   *
   * Named nodes correspond to named rules in the grammar, whereas
   * *anonymous* nodes correspond to string literals in the grammar.
   */
  get isNamed() {
    marshalNode(this);
    return C._ts_node_is_named_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node is *extra*.
   *
   * Extra nodes represent things like comments, which are not required
   * by the grammar, but can appear anywhere.
   */
  get isExtra() {
    marshalNode(this);
    return C._ts_node_is_extra_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node represents a syntax error.
   *
   * Syntax errors represent parts of the code that could not be incorporated
   * into a valid syntax tree.
   */
  get isError() {
    marshalNode(this);
    return C._ts_node_is_error_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node is *missing*.
   *
   * Missing nodes are inserted by the parser in order to recover from
   * certain kinds of syntax errors.
   */
  get isMissing() {
    marshalNode(this);
    return C._ts_node_is_missing_wasm(this.tree[0]) === 1;
  }
  /** Check if this node has been edited. */
  get hasChanges() {
    marshalNode(this);
    return C._ts_node_has_changes_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node represents a syntax error or contains any syntax
   * errors anywhere within it.
   */
  get hasError() {
    marshalNode(this);
    return C._ts_node_has_error_wasm(this.tree[0]) === 1;
  }
  /** Get the byte index where this node ends. */
  get endIndex() {
    marshalNode(this);
    return C._ts_node_end_index_wasm(this.tree[0]);
  }
  /** Get the position where this node ends. */
  get endPosition() {
    marshalNode(this);
    C._ts_node_end_point_wasm(this.tree[0]);
    return unmarshalPoint(TRANSFER_BUFFER);
  }
  /** Get the string content of this node. */
  get text() {
    return getText(this.tree, this.startIndex, this.endIndex, this.startPosition);
  }
  /** Get this node's parse state. */
  get parseState() {
    marshalNode(this);
    return C._ts_node_parse_state_wasm(this.tree[0]);
  }
  /** Get the parse state after this node. */
  get nextParseState() {
    marshalNode(this);
    return C._ts_node_next_parse_state_wasm(this.tree[0]);
  }
  /** Check if this node is equal to another node. */
  equals(other) {
    return this.tree === other.tree && this.id === other.id;
  }
  /**
   * Get the node's child at the given index, where zero represents the first child.
   *
   * This method is fairly fast, but its cost is technically log(n), so if
   * you might be iterating over a long list of children, you should use
   * {@link Node#children} instead.
   */
  child(index) {
    marshalNode(this);
    C._ts_node_child_wasm(this.tree[0], index);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's *named* child at the given index.
   *
   * See also {@link Node#isNamed}.
   * This method is fairly fast, but its cost is technically log(n), so if
   * you might be iterating over a long list of children, you should use
   * {@link Node#namedChildren} instead.
   */
  namedChild(index) {
    marshalNode(this);
    C._ts_node_named_child_wasm(this.tree[0], index);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's child with the given numerical field id.
   *
   * See also {@link Node#childForFieldName}. You can
   * convert a field name to an id using {@link Language#fieldIdForName}.
   */
  childForFieldId(fieldId) {
    marshalNode(this);
    C._ts_node_child_by_field_id_wasm(this.tree[0], fieldId);
    return unmarshalNode(this.tree);
  }
  /**
   * Get the first child with the given field name.
   *
   * If multiple children may have the same field name, access them using
   * {@link Node#childrenForFieldName}.
   */
  childForFieldName(fieldName) {
    const fieldId = this.tree.language.fields.indexOf(fieldName);
    if (fieldId !== -1) return this.childForFieldId(fieldId);
    return null;
  }
  /** Get the field name of this node's child at the given index. */
  fieldNameForChild(index) {
    marshalNode(this);
    const address = C._ts_node_field_name_for_child_wasm(this.tree[0], index);
    if (!address) return null;
    return C.AsciiToString(address);
  }
  /** Get the field name of this node's named child at the given index. */
  fieldNameForNamedChild(index) {
    marshalNode(this);
    const address = C._ts_node_field_name_for_named_child_wasm(this.tree[0], index);
    if (!address) return null;
    return C.AsciiToString(address);
  }
  /**
   * Get an array of this node's children with a given field name.
   *
   * See also {@link Node#children}.
   */
  childrenForFieldName(fieldName) {
    const fieldId = this.tree.language.fields.indexOf(fieldName);
    if (fieldId !== -1 && fieldId !== 0) return this.childrenForFieldId(fieldId);
    return [];
  }
  /**
    * Get an array of this node's children with a given field id.
    *
    * See also {@link Node#childrenForFieldName}.
    */
  childrenForFieldId(fieldId) {
    marshalNode(this);
    C._ts_node_children_by_field_id_wasm(this.tree[0], fieldId);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalNode(this.tree, address);
        address += SIZE_OF_NODE;
      }
      C._free(buffer);
    }
    return result;
  }
  /** Get the node's first child that contains or starts after the given byte offset. */
  firstChildForIndex(index) {
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, index, "i32");
    C._ts_node_first_child_for_byte_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the node's first named child that contains or starts after the given byte offset. */
  firstNamedChildForIndex(index) {
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, index, "i32");
    C._ts_node_first_named_child_for_byte_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get this node's number of children. */
  get childCount() {
    marshalNode(this);
    return C._ts_node_child_count_wasm(this.tree[0]);
  }
  /**
   * Get this node's number of *named* children.
   *
   * See also {@link Node#isNamed}.
   */
  get namedChildCount() {
    marshalNode(this);
    return C._ts_node_named_child_count_wasm(this.tree[0]);
  }
  /** Get this node's first child. */
  get firstChild() {
    return this.child(0);
  }
  /**
   * Get this node's first named child.
   *
   * See also {@link Node#isNamed}.
   */
  get firstNamedChild() {
    return this.namedChild(0);
  }
  /** Get this node's last child. */
  get lastChild() {
    return this.child(this.childCount - 1);
  }
  /**
   * Get this node's last named child.
   *
   * See also {@link Node#isNamed}.
   */
  get lastNamedChild() {
    return this.namedChild(this.namedChildCount - 1);
  }
  /**
   * Iterate over this node's children.
   *
   * If you're walking the tree recursively, you may want to use the
   * {@link TreeCursor} APIs directly instead.
   */
  get children() {
    if (!this._children) {
      marshalNode(this);
      C._ts_node_children_wasm(this.tree[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      this._children = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          this._children[i2] = unmarshalNode(this.tree, address);
          address += SIZE_OF_NODE;
        }
        C._free(buffer);
      }
    }
    return this._children;
  }
  /**
   * Iterate over this node's named children.
   *
   * See also {@link Node#children}.
   */
  get namedChildren() {
    if (!this._namedChildren) {
      marshalNode(this);
      C._ts_node_named_children_wasm(this.tree[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      this._namedChildren = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          this._namedChildren[i2] = unmarshalNode(this.tree, address);
          address += SIZE_OF_NODE;
        }
        C._free(buffer);
      }
    }
    return this._namedChildren;
  }
  /**
   * Get the descendants of this node that are the given type, or in the given types array.
   *
   * The types array should contain node type strings, which can be retrieved from {@link Language#types}.
   *
   * Additionally, a `startPosition` and `endPosition` can be passed in to restrict the search to a byte range.
   */
  descendantsOfType(types, startPosition = ZERO_POINT, endPosition = ZERO_POINT) {
    if (!Array.isArray(types)) types = [types];
    const symbols = [];
    const typesBySymbol = this.tree.language.types;
    for (const node_type of types) {
      if (node_type == "ERROR") {
        symbols.push(65535);
      }
    }
    for (let i2 = 0, n = typesBySymbol.length; i2 < n; i2++) {
      if (types.includes(typesBySymbol[i2])) {
        symbols.push(i2);
      }
    }
    const symbolsAddress = C._malloc(SIZE_OF_INT * symbols.length);
    for (let i2 = 0, n = symbols.length; i2 < n; i2++) {
      C.setValue(symbolsAddress + i2 * SIZE_OF_INT, symbols[i2], "i32");
    }
    marshalNode(this);
    C._ts_node_descendants_of_type_wasm(
      this.tree[0],
      symbolsAddress,
      symbols.length,
      startPosition.row,
      startPosition.column,
      endPosition.row,
      endPosition.column
    );
    const descendantCount = C.getValue(TRANSFER_BUFFER, "i32");
    const descendantAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(descendantCount);
    if (descendantCount > 0) {
      let address = descendantAddress;
      for (let i2 = 0; i2 < descendantCount; i2++) {
        result[i2] = unmarshalNode(this.tree, address);
        address += SIZE_OF_NODE;
      }
    }
    C._free(descendantAddress);
    C._free(symbolsAddress);
    return result;
  }
  /** Get this node's next sibling. */
  get nextSibling() {
    marshalNode(this);
    C._ts_node_next_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get this node's previous sibling. */
  get previousSibling() {
    marshalNode(this);
    C._ts_node_prev_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's next *named* sibling.
   *
   * See also {@link Node#isNamed}.
   */
  get nextNamedSibling() {
    marshalNode(this);
    C._ts_node_next_named_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's previous *named* sibling.
   *
   * See also {@link Node#isNamed}.
   */
  get previousNamedSibling() {
    marshalNode(this);
    C._ts_node_prev_named_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the node's number of descendants, including one for the node itself. */
  get descendantCount() {
    marshalNode(this);
    return C._ts_node_descendant_count_wasm(this.tree[0]);
  }
  /**
   * Get this node's immediate parent.
   * Prefer {@link Node#childWithDescendant} for iterating over this node's ancestors.
   */
  get parent() {
    marshalNode(this);
    C._ts_node_parent_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get the node that contains `descendant`.
   *
   * Note that this can return `descendant` itself.
   */
  childWithDescendant(descendant) {
    marshalNode(this);
    marshalNode(descendant, 1);
    C._ts_node_child_with_descendant_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest node within this node that spans the given byte range. */
  descendantForIndex(start2, end = start2) {
    if (typeof start2 !== "number" || typeof end !== "number") {
      throw new Error("Arguments must be numbers");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, start2, "i32");
    C.setValue(address + SIZE_OF_INT, end, "i32");
    C._ts_node_descendant_for_index_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest named node within this node that spans the given byte range. */
  namedDescendantForIndex(start2, end = start2) {
    if (typeof start2 !== "number" || typeof end !== "number") {
      throw new Error("Arguments must be numbers");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, start2, "i32");
    C.setValue(address + SIZE_OF_INT, end, "i32");
    C._ts_node_named_descendant_for_index_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest node within this node that spans the given point range. */
  descendantForPosition(start2, end = start2) {
    if (!isPoint(start2) || !isPoint(end)) {
      throw new Error("Arguments must be {row, column} objects");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    marshalPoint(address, start2);
    marshalPoint(address + SIZE_OF_POINT, end);
    C._ts_node_descendant_for_position_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest named node within this node that spans the given point range. */
  namedDescendantForPosition(start2, end = start2) {
    if (!isPoint(start2) || !isPoint(end)) {
      throw new Error("Arguments must be {row, column} objects");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    marshalPoint(address, start2);
    marshalPoint(address + SIZE_OF_POINT, end);
    C._ts_node_named_descendant_for_position_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Create a new {@link TreeCursor} starting from this node.
   *
   * Note that the given node is considered the root of the cursor,
   * and the cursor cannot walk outside this node.
   */
  walk() {
    marshalNode(this);
    C._ts_tree_cursor_new_wasm(this.tree[0]);
    return new TreeCursor(INTERNAL, this.tree);
  }
  /**
   * Edit this node to keep it in-sync with source code that has been edited.
   *
   * This function is only rarely needed. When you edit a syntax tree with
   * the {@link Tree#edit} method, all of the nodes that you retrieve from
   * the tree afterward will already reflect the edit. You only need to
   * use {@link Node#edit} when you have a specific {@link Node} instance that
   * you want to keep and continue to use after an edit.
   */
  edit(edit) {
    if (this.startIndex >= edit.oldEndIndex) {
      this.startIndex = edit.newEndIndex + (this.startIndex - edit.oldEndIndex);
      let subbedPointRow;
      let subbedPointColumn;
      if (this.startPosition.row > edit.oldEndPosition.row) {
        subbedPointRow = this.startPosition.row - edit.oldEndPosition.row;
        subbedPointColumn = this.startPosition.column;
      } else {
        subbedPointRow = 0;
        subbedPointColumn = this.startPosition.column;
        if (this.startPosition.column >= edit.oldEndPosition.column) {
          subbedPointColumn = this.startPosition.column - edit.oldEndPosition.column;
        }
      }
      if (subbedPointRow > 0) {
        this.startPosition.row += subbedPointRow;
        this.startPosition.column = subbedPointColumn;
      } else {
        this.startPosition.column += subbedPointColumn;
      }
    } else if (this.startIndex > edit.startIndex) {
      this.startIndex = edit.newEndIndex;
      this.startPosition.row = edit.newEndPosition.row;
      this.startPosition.column = edit.newEndPosition.column;
    }
  }
  /** Get the S-expression representation of this node. */
  toString() {
    marshalNode(this);
    const address = C._ts_node_to_string_wasm(this.tree[0]);
    const result = C.AsciiToString(address);
    C._free(address);
    return result;
  }
};
function unmarshalCaptures(query, tree, address, patternIndex, result) {
  for (let i2 = 0, n = result.length; i2 < n; i2++) {
    const captureIndex = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    const node = unmarshalNode(tree, address);
    address += SIZE_OF_NODE;
    result[i2] = { patternIndex, name: query.captureNames[captureIndex], node };
  }
  return address;
}
__name(unmarshalCaptures, "unmarshalCaptures");
function marshalNode(node, index = 0) {
  let address = TRANSFER_BUFFER + index * SIZE_OF_NODE;
  C.setValue(address, node.id, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node.startIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node.startPosition.row, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node.startPosition.column, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node[0], "i32");
}
__name(marshalNode, "marshalNode");
function unmarshalNode(tree, address = TRANSFER_BUFFER) {
  const id = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  if (id === 0) return null;
  const index = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  const row = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  const column = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  const other = C.getValue(address, "i32");
  const result = new Node(INTERNAL, {
    id,
    tree,
    startIndex: index,
    startPosition: { row, column },
    other
  });
  return result;
}
__name(unmarshalNode, "unmarshalNode");
function marshalTreeCursor(cursor, address = TRANSFER_BUFFER) {
  C.setValue(address + 0 * SIZE_OF_INT, cursor[0], "i32");
  C.setValue(address + 1 * SIZE_OF_INT, cursor[1], "i32");
  C.setValue(address + 2 * SIZE_OF_INT, cursor[2], "i32");
  C.setValue(address + 3 * SIZE_OF_INT, cursor[3], "i32");
}
__name(marshalTreeCursor, "marshalTreeCursor");
function unmarshalTreeCursor(cursor) {
  cursor[0] = C.getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32");
  cursor[1] = C.getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32");
  cursor[2] = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
  cursor[3] = C.getValue(TRANSFER_BUFFER + 3 * SIZE_OF_INT, "i32");
}
__name(unmarshalTreeCursor, "unmarshalTreeCursor");
function marshalPoint(address, point) {
  C.setValue(address, point.row, "i32");
  C.setValue(address + SIZE_OF_INT, point.column, "i32");
}
__name(marshalPoint, "marshalPoint");
function unmarshalPoint(address) {
  const result = {
    row: C.getValue(address, "i32") >>> 0,
    column: C.getValue(address + SIZE_OF_INT, "i32") >>> 0
  };
  return result;
}
__name(unmarshalPoint, "unmarshalPoint");
function marshalRange(address, range) {
  marshalPoint(address, range.startPosition);
  address += SIZE_OF_POINT;
  marshalPoint(address, range.endPosition);
  address += SIZE_OF_POINT;
  C.setValue(address, range.startIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, range.endIndex, "i32");
  address += SIZE_OF_INT;
}
__name(marshalRange, "marshalRange");
function unmarshalRange(address) {
  const result = {};
  result.startPosition = unmarshalPoint(address);
  address += SIZE_OF_POINT;
  result.endPosition = unmarshalPoint(address);
  address += SIZE_OF_POINT;
  result.startIndex = C.getValue(address, "i32") >>> 0;
  address += SIZE_OF_INT;
  result.endIndex = C.getValue(address, "i32") >>> 0;
  return result;
}
__name(unmarshalRange, "unmarshalRange");
function marshalEdit(edit, address = TRANSFER_BUFFER) {
  marshalPoint(address, edit.startPosition);
  address += SIZE_OF_POINT;
  marshalPoint(address, edit.oldEndPosition);
  address += SIZE_OF_POINT;
  marshalPoint(address, edit.newEndPosition);
  address += SIZE_OF_POINT;
  C.setValue(address, edit.startIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, edit.oldEndIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, edit.newEndIndex, "i32");
  address += SIZE_OF_INT;
}
__name(marshalEdit, "marshalEdit");
function unmarshalLanguageMetadata(address) {
  const major_version = C.getValue(address, "i32");
  const minor_version = C.getValue(address += SIZE_OF_INT, "i32");
  const patch_version = C.getValue(address += SIZE_OF_INT, "i32");
  return { major_version, minor_version, patch_version };
}
__name(unmarshalLanguageMetadata, "unmarshalLanguageMetadata");
var LANGUAGE_FUNCTION_REGEX = /^tree_sitter_\w+$/;
var Language = class _Language {
  static {
    __name(this, "Language");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /**
   * A list of all node types in the language. The index of each type in this
   * array is its node type id.
   */
  types;
  /**
   * A list of all field names in the language. The index of each field name in
   * this array is its field id.
   */
  fields;
  /** @internal */
  constructor(internal, address) {
    assertInternal(internal);
    this[0] = address;
    this.types = new Array(C._ts_language_symbol_count(this[0]));
    for (let i2 = 0, n = this.types.length; i2 < n; i2++) {
      if (C._ts_language_symbol_type(this[0], i2) < 2) {
        this.types[i2] = C.UTF8ToString(C._ts_language_symbol_name(this[0], i2));
      }
    }
    this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
    for (let i2 = 0, n = this.fields.length; i2 < n; i2++) {
      const fieldName = C._ts_language_field_name_for_id(this[0], i2);
      if (fieldName !== 0) {
        this.fields[i2] = C.UTF8ToString(fieldName);
      } else {
        this.fields[i2] = null;
      }
    }
  }
  /**
   * Gets the name of the language.
   */
  get name() {
    const ptr = C._ts_language_name(this[0]);
    if (ptr === 0) return null;
    return C.UTF8ToString(ptr);
  }
  /**
   * Gets the ABI version of the language.
   */
  get abiVersion() {
    return C._ts_language_abi_version(this[0]);
  }
  /**
  * Get the metadata for this language. This information is generated by the
  * CLI, and relies on the language author providing the correct metadata in
  * the language's `tree-sitter.json` file.
  */
  get metadata() {
    C._ts_language_metadata_wasm(this[0]);
    const length = C.getValue(TRANSFER_BUFFER, "i32");
    if (length === 0) return null;
    return unmarshalLanguageMetadata(TRANSFER_BUFFER + SIZE_OF_INT);
  }
  /**
   * Gets the number of fields in the language.
   */
  get fieldCount() {
    return this.fields.length - 1;
  }
  /**
   * Gets the number of states in the language.
   */
  get stateCount() {
    return C._ts_language_state_count(this[0]);
  }
  /**
   * Get the field id for a field name.
   */
  fieldIdForName(fieldName) {
    const result = this.fields.indexOf(fieldName);
    return result !== -1 ? result : null;
  }
  /**
   * Get the field name for a field id.
   */
  fieldNameForId(fieldId) {
    return this.fields[fieldId] ?? null;
  }
  /**
   * Get the node type id for a node type name.
   */
  idForNodeType(type, named) {
    const typeLength = C.lengthBytesUTF8(type);
    const typeAddress = C._malloc(typeLength + 1);
    C.stringToUTF8(type, typeAddress, typeLength + 1);
    const result = C._ts_language_symbol_for_name(this[0], typeAddress, typeLength, named ? 1 : 0);
    C._free(typeAddress);
    return result || null;
  }
  /**
   * Gets the number of node types in the language.
   */
  get nodeTypeCount() {
    return C._ts_language_symbol_count(this[0]);
  }
  /**
   * Get the node type name for a node type id.
   */
  nodeTypeForId(typeId) {
    const name2 = C._ts_language_symbol_name(this[0], typeId);
    return name2 ? C.UTF8ToString(name2) : null;
  }
  /**
   * Check if a node type is named.
   *
   * @see {@link https://tree-sitter.github.io/tree-sitter/using-parsers/2-basic-parsing.html#named-vs-anonymous-nodes}
   */
  nodeTypeIsNamed(typeId) {
    return C._ts_language_type_is_named_wasm(this[0], typeId) ? true : false;
  }
  /**
   * Check if a node type is visible.
   */
  nodeTypeIsVisible(typeId) {
    return C._ts_language_type_is_visible_wasm(this[0], typeId) ? true : false;
  }
  /**
   * Get the supertypes ids of this language.
   *
   * @see {@link https://tree-sitter.github.io/tree-sitter/using-parsers/6-static-node-types.html?highlight=supertype#supertype-nodes}
   */
  get supertypes() {
    C._ts_language_supertypes_wasm(this[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = C.getValue(address, "i16");
        address += SIZE_OF_SHORT;
      }
    }
    return result;
  }
  /**
   * Get the subtype ids for a given supertype node id.
   */
  subtypes(supertype) {
    C._ts_language_subtypes_wasm(this[0], supertype);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = C.getValue(address, "i16");
        address += SIZE_OF_SHORT;
      }
    }
    return result;
  }
  /**
   * Get the next state id for a given state id and node type id.
   */
  nextState(stateId, typeId) {
    return C._ts_language_next_state(this[0], stateId, typeId);
  }
  /**
   * Create a new lookahead iterator for this language and parse state.
   *
   * This returns `null` if state is invalid for this language.
   *
   * Iterating {@link LookaheadIterator} will yield valid symbols in the given
   * parse state. A newly created iterator is not positioned on a symbol, so
   * {@link LookaheadIterator#currentType} returns `null` until the first
   * iteration step.
   *
   * Lookahead iterators can be useful for generating suggestions and improving
   * syntax error diagnostics. To get symbols valid in an `ERROR` node, use the
   * lookahead iterator on its first leaf node state. For `MISSING` nodes, a
   * lookahead iterator created on the previous non-extra leaf node may be
   * appropriate.
   */
  lookaheadIterator(stateId) {
    const address = C._ts_lookahead_iterator_new(this[0], stateId);
    if (address) return new LookaheadIterator(INTERNAL, address, this);
    return null;
  }
  /**
   * Load a language from a WebAssembly module.
   * The module can be provided as a path to a file, a `URL` to a file, or as a
   * buffer.
   */
  static async load(input) {
    let binary2;
    if (input instanceof Uint8Array) {
      binary2 = input;
    } else if (globalThis.process?.versions.node) {
      const fs2 = await import("fs/promises");
      binary2 = await fs2.readFile(input);
    } else {
      const response = await fetch(input);
      if (!response.ok) {
        const body2 = await response.text();
        throw new Error(`Language.load failed with status ${response.status}.

${body2}`);
      }
      const retryResp = response.clone();
      try {
        binary2 = await WebAssembly.compileStreaming(response);
      } catch (reason) {
        console.error("wasm streaming compile failed:", reason);
        console.error("falling back to ArrayBuffer instantiation");
        binary2 = new Uint8Array(await retryResp.arrayBuffer());
      }
    }
    const mod = await C.loadWebAssemblyModule(binary2, { loadAsync: true });
    return _Language.loadFromWasmExports(mod, { sync: false });
  }
  static loadFromWasmExports(mod, { sync }) {
    const symbolNames = Object.keys(mod);
    const functionName = symbolNames.find((key) => LANGUAGE_FUNCTION_REGEX.test(key) && !key.includes("external_scanner_"));
    if (!functionName) {
      console.log(`Couldn't find language function in Wasm file. Symbols:
${JSON.stringify(symbolNames, null, 2)}`);
      throw new Error(`Language.${sync ? "loadSync" : "load"} failed: no language function found in Wasm file`);
    }
    const languageAddress = mod[functionName]();
    return new _Language(INTERNAL, languageAddress);
  }
  /**
   * Load a language synchronously from a pre-compiled WebAssembly module.
   * Use this when the host environment provides a `WebAssembly.Module` directly.
   */
  static loadSync(wasmModule) {
    const mod = C.loadWebAssemblyModule(wasmModule, { loadAsync: false });
    return _Language.loadFromWasmExports(mod, { sync: true });
  }
};
async function Module2(moduleArg = {}) {
  var moduleRtn;
  var Module = moduleArg;
  var ENVIRONMENT_IS_WEB = typeof window == "object";
  var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
  var ENVIRONMENT_IS_NODE = typeof process == "object" && process.versions?.node && process.type != "renderer";
  if (ENVIRONMENT_IS_NODE) {
    const { createRequire: createRequire2 } = await import("module");
    var require = createRequire2(import.meta.url);
  }
  Module.currentQueryProgressCallback = null;
  Module.currentProgressCallback = null;
  Module.currentLogCallback = null;
  Module.currentParseCallback = null;
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = /* @__PURE__ */ __name((status, toThrow) => {
    throw toThrow;
  }, "quit_");
  var _scriptName = import.meta.url;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  __name(locateFile, "locateFile");
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    if (_scriptName.startsWith("file:")) {
      scriptDirectory = require("path").dirname(require("url").fileURLToPath(_scriptName)) + "/";
    }
    readBinary = /* @__PURE__ */ __name((filename) => {
      filename = isFileURI(filename) ? new URL(filename) : filename;
      var ret = fs.readFileSync(filename);
      return ret;
    }, "readBinary");
    readAsync = /* @__PURE__ */ __name(async (filename, binary2 = true) => {
      filename = isFileURI(filename) ? new URL(filename) : filename;
      var ret = fs.readFileSync(filename, binary2 ? void 0 : "utf8");
      return ret;
    }, "readAsync");
    if (process.argv.length > 1) {
      thisProgram = process.argv[1].replace(/\\/g, "/");
    }
    arguments_ = process.argv.slice(2);
    quit_ = /* @__PURE__ */ __name((status, toThrow) => {
      process.exitCode = status;
      throw toThrow;
    }, "quit_");
  } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {
    }
    {
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = /* @__PURE__ */ __name((url) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(
            /** @type{!ArrayBuffer} */
            xhr.response
          );
        }, "readBinary");
      }
      readAsync = /* @__PURE__ */ __name(async (url) => {
        if (isFileURI(url)) {
          return new Promise((resolve2, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
              if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                resolve2(xhr.response);
                return;
              }
              reject(xhr.status);
            };
            xhr.onerror = reject;
            xhr.send(null);
          });
        }
        var response = await fetch(url, {
          credentials: "same-origin"
        });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      }, "readAsync");
    }
  } else {
  }
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var dynamicLibraries = [];
  var wasmBinary;
  var ABORT = false;
  var EXITSTATUS;
  var isFileURI = /* @__PURE__ */ __name((filename) => filename.startsWith("file://"), "isFileURI");
  var readyPromiseResolve, readyPromiseReject;
  var wasmMemory;
  var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  var HEAP64, HEAPU64;
  var HEAP_DATA_VIEW;
  var runtimeInitialized = false;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module["HEAP8"] = HEAP8 = new Int8Array(b);
    Module["HEAP16"] = HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
    Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
    Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
    Module["HEAP_DATA_VIEW"] = HEAP_DATA_VIEW = new DataView(b);
    LE_HEAP_UPDATE();
  }
  __name(updateMemoryViews, "updateMemoryViews");
  function initMemory() {
    if (Module["wasmMemory"]) {
      wasmMemory = Module["wasmMemory"];
    } else {
      var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
      wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_MEMORY / 65536,
        // In theory we should not need to emit the maximum if we want "unlimited"
        // or 4GB of memory, but VMs error on that atm, see
        // https://github.com/emscripten-core/emscripten/issues/14130
        // And in the pthreads case we definitely need to emit a maximum. So
        // always emit one.
        "maximum": 32768
      });
    }
    updateMemoryViews();
  }
  __name(initMemory, "initMemory");
  var __RELOC_FUNCS__ = [];
  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift());
      }
    }
    callRuntimeCallbacks(onPreRuns);
  }
  __name(preRun, "preRun");
  function initRuntime() {
    runtimeInitialized = true;
    callRuntimeCallbacks(__RELOC_FUNCS__);
    wasmExports["__wasm_call_ctors"]();
    callRuntimeCallbacks(onPostCtors);
  }
  __name(initRuntime, "initRuntime");
  function preMain() {
  }
  __name(preMain, "preMain");
  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift());
      }
    }
    callRuntimeCallbacks(onPostRuns);
  }
  __name(postRun, "postRun");
  function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    readyPromiseReject?.(e);
    throw e;
  }
  __name(abort, "abort");
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module["locateFile"]) {
      return locateFile("web-tree-sitter.wasm");
    }
    return new URL("web-tree-sitter.wasm", import.meta.url).href;
  }
  __name(findWasmBinary, "findWasmBinary");
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  __name(getBinarySync, "getBinarySync");
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {
      }
    }
    return getBinarySync(binaryFile);
  }
  __name(getWasmBinary, "getWasmBinary");
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary2 = await getWasmBinary(binaryFile);
      var instance2 = await WebAssembly.instantiate(binary2, imports);
      return instance2;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  __name(instantiateArrayBuffer, "instantiateArrayBuffer");
  async function instantiateAsync(binary2, binaryFile, imports) {
    if (!binary2 && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
      try {
        var response = fetch(binaryFile, {
          credentials: "same-origin"
        });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  __name(instantiateAsync, "instantiateAsync");
  function getWasmImports() {
    return {
      "env": wasmImports,
      "wasi_snapshot_preview1": wasmImports,
      "GOT.mem": new Proxy(wasmImports, GOTHandler),
      "GOT.func": new Proxy(wasmImports, GOTHandler)
    };
  }
  __name(getWasmImports, "getWasmImports");
  async function createWasm() {
    function receiveInstance(instance2, module2) {
      wasmExports = instance2.exports;
      wasmExports = relocateExports(wasmExports, 1024);
      var metadata2 = getDylinkMetadata(module2);
      if (metadata2.neededDynlibs) {
        dynamicLibraries = metadata2.neededDynlibs.concat(dynamicLibraries);
      }
      mergeLibSymbols(wasmExports, "main");
      LDSO.init();
      loadDylibs();
      __RELOC_FUNCS__.push(wasmExports["__wasm_apply_data_relocs"]);
      assignWasmExports(wasmExports);
      return wasmExports;
    }
    __name(receiveInstance, "receiveInstance");
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"], result2["module"]);
    }
    __name(receiveInstantiationResult, "receiveInstantiationResult");
    var info2 = getWasmImports();
    if (Module["instantiateWasm"]) {
      return new Promise((resolve2, reject) => {
        Module["instantiateWasm"](info2, (mod, inst) => {
          resolve2(receiveInstance(mod, inst));
        });
      });
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info2);
    var exports = receiveInstantiationResult(result);
    return exports;
  }
  __name(createWasm, "createWasm");
  class ExitStatus {
    static {
      __name(this, "ExitStatus");
    }
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var GOT = {};
  var currentModuleWeakSymbols = /* @__PURE__ */ new Set([]);
  var GOTHandler = {
    get(obj, symName) {
      var rtn = GOT[symName];
      if (!rtn) {
        rtn = GOT[symName] = new WebAssembly.Global({
          "value": "i32",
          "mutable": true
        });
      }
      if (!currentModuleWeakSymbols.has(symName)) {
        rtn.required = true;
      }
      return rtn;
    }
  };
  var LE_ATOMICS_NATIVE_BYTE_ORDER = [];
  var LE_HEAP_LOAD_F32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getFloat32(byteOffset, true), "LE_HEAP_LOAD_F32");
  var LE_HEAP_LOAD_F64 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getFloat64(byteOffset, true), "LE_HEAP_LOAD_F64");
  var LE_HEAP_LOAD_I16 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getInt16(byteOffset, true), "LE_HEAP_LOAD_I16");
  var LE_HEAP_LOAD_I32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getInt32(byteOffset, true), "LE_HEAP_LOAD_I32");
  var LE_HEAP_LOAD_I64 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getBigInt64(byteOffset, true), "LE_HEAP_LOAD_I64");
  var LE_HEAP_LOAD_U32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getUint32(byteOffset, true), "LE_HEAP_LOAD_U32");
  var LE_HEAP_STORE_F32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setFloat32(byteOffset, value, true), "LE_HEAP_STORE_F32");
  var LE_HEAP_STORE_F64 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setFloat64(byteOffset, value, true), "LE_HEAP_STORE_F64");
  var LE_HEAP_STORE_I16 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setInt16(byteOffset, value, true), "LE_HEAP_STORE_I16");
  var LE_HEAP_STORE_I32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setInt32(byteOffset, value, true), "LE_HEAP_STORE_I32");
  var LE_HEAP_STORE_I64 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setBigInt64(byteOffset, value, true), "LE_HEAP_STORE_I64");
  var LE_HEAP_STORE_U32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setUint32(byteOffset, value, true), "LE_HEAP_STORE_U32");
  var callRuntimeCallbacks = /* @__PURE__ */ __name((callbacks) => {
    while (callbacks.length > 0) {
      callbacks.shift()(Module);
    }
  }, "callRuntimeCallbacks");
  var onPostRuns = [];
  var addOnPostRun = /* @__PURE__ */ __name((cb) => onPostRuns.push(cb), "addOnPostRun");
  var onPreRuns = [];
  var addOnPreRun = /* @__PURE__ */ __name((cb) => onPreRuns.push(cb), "addOnPreRun");
  var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
  var findStringEnd = /* @__PURE__ */ __name((heapOrArray, idx, maxBytesToRead, ignoreNul) => {
    var maxIdx = idx + maxBytesToRead;
    if (ignoreNul) return maxIdx;
    while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
    return idx;
  }, "findStringEnd");
  var UTF8ArrayToString = /* @__PURE__ */ __name((heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
    var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
    return str;
  }, "UTF8ArrayToString");
  var getDylinkMetadata = /* @__PURE__ */ __name((binary2) => {
    var offset = 0;
    var end = 0;
    function getU8() {
      return binary2[offset++];
    }
    __name(getU8, "getU8");
    function getLEB() {
      var ret = 0;
      var mul = 1;
      while (1) {
        var byte = binary2[offset++];
        ret += (byte & 127) * mul;
        mul *= 128;
        if (!(byte & 128)) break;
      }
      return ret;
    }
    __name(getLEB, "getLEB");
    function getString() {
      var len = getLEB();
      offset += len;
      return UTF8ArrayToString(binary2, offset - len, len);
    }
    __name(getString, "getString");
    function getStringList() {
      var count2 = getLEB();
      var rtn = [];
      while (count2--) rtn.push(getString());
      return rtn;
    }
    __name(getStringList, "getStringList");
    function failIf(condition, message) {
      if (condition) throw new Error(message);
    }
    __name(failIf, "failIf");
    if (binary2 instanceof WebAssembly.Module) {
      var dylinkSection = WebAssembly.Module.customSections(binary2, "dylink.0");
      failIf(dylinkSection.length === 0, "need dylink section");
      binary2 = new Uint8Array(dylinkSection[0]);
      end = binary2.length;
    } else {
      var int32View = new Uint32Array(new Uint8Array(binary2.subarray(0, 24)).buffer);
      var magicNumberFound = int32View[0] == 1836278016 || int32View[0] == 6386541;
      failIf(!magicNumberFound, "need to see wasm magic number");
      failIf(binary2[8] !== 0, "need the dylink section to be first");
      offset = 9;
      var section_size = getLEB();
      end = offset + section_size;
      var name2 = getString();
      failIf(name2 !== "dylink.0");
    }
    var customSection = {
      neededDynlibs: [],
      tlsExports: /* @__PURE__ */ new Set(),
      weakImports: /* @__PURE__ */ new Set(),
      runtimePaths: []
    };
    var WASM_DYLINK_MEM_INFO = 1;
    var WASM_DYLINK_NEEDED = 2;
    var WASM_DYLINK_EXPORT_INFO = 3;
    var WASM_DYLINK_IMPORT_INFO = 4;
    var WASM_DYLINK_RUNTIME_PATH = 5;
    var WASM_SYMBOL_TLS = 256;
    var WASM_SYMBOL_BINDING_MASK = 3;
    var WASM_SYMBOL_BINDING_WEAK = 1;
    while (offset < end) {
      var subsectionType = getU8();
      var subsectionSize = getLEB();
      if (subsectionType === WASM_DYLINK_MEM_INFO) {
        customSection.memorySize = getLEB();
        customSection.memoryAlign = getLEB();
        customSection.tableSize = getLEB();
        customSection.tableAlign = getLEB();
      } else if (subsectionType === WASM_DYLINK_NEEDED) {
        customSection.neededDynlibs = getStringList();
      } else if (subsectionType === WASM_DYLINK_EXPORT_INFO) {
        var count = getLEB();
        while (count--) {
          var symname = getString();
          var flags2 = getLEB();
          if (flags2 & WASM_SYMBOL_TLS) {
            customSection.tlsExports.add(symname);
          }
        }
      } else if (subsectionType === WASM_DYLINK_IMPORT_INFO) {
        var count = getLEB();
        while (count--) {
          var modname = getString();
          var symname = getString();
          var flags2 = getLEB();
          if ((flags2 & WASM_SYMBOL_BINDING_MASK) == WASM_SYMBOL_BINDING_WEAK) {
            customSection.weakImports.add(symname);
          }
        }
      } else if (subsectionType === WASM_DYLINK_RUNTIME_PATH) {
        customSection.runtimePaths = getStringList();
      } else {
        offset += subsectionSize;
      }
    }
    return customSection;
  }, "getDylinkMetadata");
  function getValue(ptr, type = "i8") {
    if (type.endsWith("*")) type = "*";
    switch (type) {
      case "i1":
        return HEAP8[ptr];
      case "i8":
        return HEAP8[ptr];
      case "i16":
        return LE_HEAP_LOAD_I16((ptr >> 1) * 2);
      case "i32":
        return LE_HEAP_LOAD_I32((ptr >> 2) * 4);
      case "i64":
        return LE_HEAP_LOAD_I64((ptr >> 3) * 8);
      case "float":
        return LE_HEAP_LOAD_F32((ptr >> 2) * 4);
      case "double":
        return LE_HEAP_LOAD_F64((ptr >> 3) * 8);
      case "*":
        return LE_HEAP_LOAD_U32((ptr >> 2) * 4);
      default:
        abort(`invalid type for getValue: ${type}`);
    }
  }
  __name(getValue, "getValue");
  var newDSO = /* @__PURE__ */ __name((name2, handle2, syms) => {
    var dso = {
      refcount: Infinity,
      name: name2,
      exports: syms,
      global: true
    };
    LDSO.loadedLibsByName[name2] = dso;
    if (handle2 != void 0) {
      LDSO.loadedLibsByHandle[handle2] = dso;
    }
    return dso;
  }, "newDSO");
  var LDSO = {
    loadedLibsByName: {},
    loadedLibsByHandle: {},
    init() {
      newDSO("__main__", 0, wasmImports);
    }
  };
  var ___heap_base = 82240;
  var alignMemory = /* @__PURE__ */ __name((size, alignment) => Math.ceil(size / alignment) * alignment, "alignMemory");
  var getMemory = /* @__PURE__ */ __name((size) => {
    if (runtimeInitialized) {
      return _calloc(size, 1);
    }
    var ret = ___heap_base;
    var end = ret + alignMemory(size, 16);
    ___heap_base = end;
    GOT["__heap_base"].value = end;
    return ret;
  }, "getMemory");
  var isInternalSym = /* @__PURE__ */ __name((symName) => ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm", "__start_em_js", "__stop_em_js"].includes(symName) || symName.startsWith("__em_js__"), "isInternalSym");
  var uleb128EncodeWithLen = /* @__PURE__ */ __name((arr) => {
    const n = arr.length;
    return [n % 128 | 128, n >> 7, ...arr];
  }, "uleb128EncodeWithLen");
  var wasmTypeCodes = {
    "i": 127,
    // i32
    "p": 127,
    // i32
    "j": 126,
    // i64
    "f": 125,
    // f32
    "d": 124,
    // f64
    "e": 111
  };
  var generateTypePack = /* @__PURE__ */ __name((types) => uleb128EncodeWithLen(Array.from(types, (type) => {
    var code = wasmTypeCodes[type];
    return code;
  })), "generateTypePack");
  var convertJsFunctionToWasm = /* @__PURE__ */ __name((func2, sig) => {
    var bytes = Uint8Array.of(
      0,
      97,
      115,
      109,
      // magic ("\0asm")
      1,
      0,
      0,
      0,
      // version: 1
      1,
      ...uleb128EncodeWithLen([
        1,
        // count: 1
        96,
        // param types
        ...generateTypePack(sig.slice(1)),
        // return types (for now only supporting [] if `void` and single [T] otherwise)
        ...generateTypePack(sig[0] === "v" ? "" : sig[0])
      ]),
      // The rest of the module is static
      2,
      7,
      // import section
      // (import "e" "f" (func 0 (type 0)))
      1,
      1,
      101,
      1,
      102,
      0,
      0,
      7,
      5,
      // export section
      // (export "f" (func 0 (type 0)))
      1,
      1,
      102,
      0,
      0
    );
    var module2 = new WebAssembly.Module(bytes);
    var instance2 = new WebAssembly.Instance(module2, {
      "e": {
        "f": func2
      }
    });
    var wrappedFunc = instance2.exports["f"];
    return wrappedFunc;
  }, "convertJsFunctionToWasm");
  var wasmTableMirror = [];
  var wasmTable = new WebAssembly.Table({
    "initial": 31,
    "element": "anyfunc"
  });
  var getWasmTableEntry = /* @__PURE__ */ __name((funcPtr) => {
    var func2 = wasmTableMirror[funcPtr];
    if (!func2) {
      wasmTableMirror[funcPtr] = func2 = wasmTable.get(funcPtr);
    }
    return func2;
  }, "getWasmTableEntry");
  var updateTableMap = /* @__PURE__ */ __name((offset, count) => {
    if (functionsInTableMap) {
      for (var i2 = offset; i2 < offset + count; i2++) {
        var item = getWasmTableEntry(i2);
        if (item) {
          functionsInTableMap.set(item, i2);
        }
      }
    }
  }, "updateTableMap");
  var functionsInTableMap;
  var getFunctionAddress = /* @__PURE__ */ __name((func2) => {
    if (!functionsInTableMap) {
      functionsInTableMap = /* @__PURE__ */ new WeakMap();
      updateTableMap(0, wasmTable.length);
    }
    return functionsInTableMap.get(func2) || 0;
  }, "getFunctionAddress");
  var freeTableIndexes = [];
  var getEmptyTableSlot = /* @__PURE__ */ __name(() => {
    if (freeTableIndexes.length) {
      return freeTableIndexes.pop();
    }
    return wasmTable["grow"](1);
  }, "getEmptyTableSlot");
  var setWasmTableEntry = /* @__PURE__ */ __name((idx, func2) => {
    wasmTable.set(idx, func2);
    wasmTableMirror[idx] = wasmTable.get(idx);
  }, "setWasmTableEntry");
  var addFunction = /* @__PURE__ */ __name((func2, sig) => {
    var rtn = getFunctionAddress(func2);
    if (rtn) {
      return rtn;
    }
    var ret = getEmptyTableSlot();
    try {
      setWasmTableEntry(ret, func2);
    } catch (err2) {
      if (!(err2 instanceof TypeError)) {
        throw err2;
      }
      var wrapped = convertJsFunctionToWasm(func2, sig);
      setWasmTableEntry(ret, wrapped);
    }
    functionsInTableMap.set(func2, ret);
    return ret;
  }, "addFunction");
  var updateGOT = /* @__PURE__ */ __name((exports, replace) => {
    for (var symName in exports) {
      if (isInternalSym(symName)) {
        continue;
      }
      var value = exports[symName];
      GOT[symName] ||= new WebAssembly.Global({
        "value": "i32",
        "mutable": true
      });
      if (replace || GOT[symName].value == 0) {
        if (typeof value == "function") {
          GOT[symName].value = addFunction(value);
        } else if (typeof value == "number") {
          GOT[symName].value = value;
        } else {
          err(`unhandled export type for '${symName}': ${typeof value}`);
        }
      }
    }
  }, "updateGOT");
  var relocateExports = /* @__PURE__ */ __name((exports, memoryBase2, replace) => {
    var relocated = {};
    for (var e in exports) {
      var value = exports[e];
      if (typeof value == "object") {
        value = value.value;
      }
      if (typeof value == "number") {
        value += memoryBase2;
      }
      relocated[e] = value;
    }
    updateGOT(relocated, replace);
    return relocated;
  }, "relocateExports");
  var isSymbolDefined = /* @__PURE__ */ __name((symName) => {
    var existing = wasmImports[symName];
    if (!existing || existing.stub) {
      return false;
    }
    return true;
  }, "isSymbolDefined");
  var dynCall = /* @__PURE__ */ __name((sig, ptr, args2 = [], promising = false) => {
    var func2 = getWasmTableEntry(ptr);
    var rtn = func2(...args2);
    function convert(rtn2) {
      return rtn2;
    }
    __name(convert, "convert");
    return convert(rtn);
  }, "dynCall");
  var stackSave = /* @__PURE__ */ __name(() => _emscripten_stack_get_current(), "stackSave");
  var stackRestore = /* @__PURE__ */ __name((val) => __emscripten_stack_restore(val), "stackRestore");
  var createInvokeFunction = /* @__PURE__ */ __name((sig) => (ptr, ...args2) => {
    var sp = stackSave();
    try {
      return dynCall(sig, ptr, args2);
    } catch (e) {
      stackRestore(sp);
      if (e !== e + 0) throw e;
      _setThrew(1, 0);
      if (sig[0] == "j") return 0n;
    }
  }, "createInvokeFunction");
  var resolveGlobalSymbol = /* @__PURE__ */ __name((symName, direct = false) => {
    var sym;
    if (isSymbolDefined(symName)) {
      sym = wasmImports[symName];
    } else if (symName.startsWith("invoke_")) {
      sym = wasmImports[symName] = createInvokeFunction(symName.split("_")[1]);
    }
    return {
      sym,
      name: symName
    };
  }, "resolveGlobalSymbol");
  var onPostCtors = [];
  var addOnPostCtor = /* @__PURE__ */ __name((cb) => onPostCtors.push(cb), "addOnPostCtor");
  var UTF8ToString = /* @__PURE__ */ __name((ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "", "UTF8ToString");
  var loadWebAssemblyModule = /* @__PURE__ */ __name((binary, flags, libName, localScope, handle) => {
    var metadata = getDylinkMetadata(binary);
    function loadModule() {
      var memAlign = Math.pow(2, metadata.memoryAlign);
      var memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0;
      var tableBase = metadata.tableSize ? wasmTable.length : 0;
      if (handle) {
        HEAP8[handle + 8] = 1;
        LE_HEAP_STORE_U32((handle + 12 >> 2) * 4, memoryBase);
        LE_HEAP_STORE_I32((handle + 16 >> 2) * 4, metadata.memorySize);
        LE_HEAP_STORE_U32((handle + 20 >> 2) * 4, tableBase);
        LE_HEAP_STORE_I32((handle + 24 >> 2) * 4, metadata.tableSize);
      }
      if (metadata.tableSize) {
        wasmTable.grow(metadata.tableSize);
      }
      var moduleExports;
      function resolveSymbol(sym) {
        var resolved = resolveGlobalSymbol(sym).sym;
        if (!resolved && localScope) {
          resolved = localScope[sym];
        }
        if (!resolved) {
          resolved = moduleExports[sym];
        }
        return resolved;
      }
      __name(resolveSymbol, "resolveSymbol");
      var proxyHandler = {
        get(stubs, prop) {
          switch (prop) {
            case "__memory_base":
              return memoryBase;
            case "__table_base":
              return tableBase;
          }
          if (prop in wasmImports && !wasmImports[prop].stub) {
            var res = wasmImports[prop];
            return res;
          }
          if (!(prop in stubs)) {
            var resolved;
            stubs[prop] = (...args2) => {
              resolved ||= resolveSymbol(prop);
              return resolved(...args2);
            };
          }
          return stubs[prop];
        }
      };
      var proxy = new Proxy({}, proxyHandler);
      currentModuleWeakSymbols = metadata.weakImports;
      var info = {
        "GOT.mem": new Proxy({}, GOTHandler),
        "GOT.func": new Proxy({}, GOTHandler),
        "env": proxy,
        "wasi_snapshot_preview1": proxy
      };
      function postInstantiation(module, instance) {
        updateTableMap(tableBase, metadata.tableSize);
        moduleExports = relocateExports(instance.exports, memoryBase);
        if (!flags.allowUndefined) {
          reportUndefinedSymbols();
        }
        function addEmAsm(addr, body) {
          var args = [];
          var arity = 0;
          for (; arity < 16; arity++) {
            if (body.indexOf("$" + arity) != -1) {
              args.push("$" + arity);
            } else {
              break;
            }
          }
          args = args.join(",");
          var func = `(${args}) => { ${body} };`;
          ASM_CONSTS[start] = eval(func);
        }
        __name(addEmAsm, "addEmAsm");
        if ("__start_em_asm" in moduleExports) {
          var start = moduleExports["__start_em_asm"];
          var stop = moduleExports["__stop_em_asm"];
          while (start < stop) {
            var jsString = UTF8ToString(start);
            addEmAsm(start, jsString);
            start = HEAPU8.indexOf(0, start) + 1;
          }
        }
        function addEmJs(name, cSig, body) {
          var jsArgs = [];
          cSig = cSig.slice(1, -1);
          if (cSig != "void") {
            cSig = cSig.split(",");
            for (var i in cSig) {
              var jsArg = cSig[i].split(" ").pop();
              jsArgs.push(jsArg.replace("*", ""));
            }
          }
          var func = `(${jsArgs}) => ${body};`;
          moduleExports[name] = eval(func);
        }
        __name(addEmJs, "addEmJs");
        for (var name in moduleExports) {
          if (name.startsWith("__em_js__")) {
            var start = moduleExports[name];
            var jsString = UTF8ToString(start);
            var parts = jsString.split("<::>");
            addEmJs(name.replace("__em_js__", ""), parts[0], parts[1]);
            delete moduleExports[name];
          }
        }
        var applyRelocs = moduleExports["__wasm_apply_data_relocs"];
        if (applyRelocs) {
          if (runtimeInitialized) {
            applyRelocs();
          } else {
            __RELOC_FUNCS__.push(applyRelocs);
          }
        }
        var init = moduleExports["__wasm_call_ctors"];
        if (init) {
          if (runtimeInitialized) {
            init();
          } else {
            addOnPostCtor(init);
          }
        }
        return moduleExports;
      }
      __name(postInstantiation, "postInstantiation");
      if (flags.loadAsync) {
        return (async () => {
          var instance2;
          if (binary instanceof WebAssembly.Module) {
            instance2 = new WebAssembly.Instance(binary, info);
          } else {
            ({ module: binary, instance: instance2 } = await WebAssembly.instantiate(binary, info));
          }
          return postInstantiation(binary, instance2);
        })();
      }
      var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary);
      var instance = new WebAssembly.Instance(module, info);
      return postInstantiation(module, instance);
    }
    __name(loadModule, "loadModule");
    flags = {
      ...flags,
      rpath: {
        parentLibPath: libName,
        paths: metadata.runtimePaths
      }
    };
    if (flags.loadAsync) {
      return metadata.neededDynlibs.reduce((chain, dynNeeded) => chain.then(() => loadDynamicLibrary(dynNeeded, flags, localScope)), Promise.resolve()).then(loadModule);
    }
    metadata.neededDynlibs.forEach((needed) => loadDynamicLibrary(needed, flags, localScope));
    return loadModule();
  }, "loadWebAssemblyModule");
  var mergeLibSymbols = /* @__PURE__ */ __name((exports, libName2) => {
    for (var [sym, exp] of Object.entries(exports)) {
      const setImport = /* @__PURE__ */ __name((target) => {
        if (!isSymbolDefined(target)) {
          wasmImports[target] = exp;
        }
      }, "setImport");
      setImport(sym);
      const main_alias = "__main_argc_argv";
      if (sym == "main") {
        setImport(main_alias);
      }
      if (sym == main_alias) {
        setImport("main");
      }
    }
  }, "mergeLibSymbols");
  var asyncLoad = /* @__PURE__ */ __name(async (url) => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer);
  }, "asyncLoad");
  function loadDynamicLibrary(libName2, flags2 = {
    global: true,
    nodelete: true
  }, localScope2, handle2) {
    var dso = LDSO.loadedLibsByName[libName2];
    if (dso) {
      if (!flags2.global) {
        if (localScope2) {
          Object.assign(localScope2, dso.exports);
        }
      } else if (!dso.global) {
        dso.global = true;
        mergeLibSymbols(dso.exports, libName2);
      }
      if (flags2.nodelete && dso.refcount !== Infinity) {
        dso.refcount = Infinity;
      }
      dso.refcount++;
      if (handle2) {
        LDSO.loadedLibsByHandle[handle2] = dso;
      }
      return flags2.loadAsync ? Promise.resolve(true) : true;
    }
    dso = newDSO(libName2, handle2, "loading");
    dso.refcount = flags2.nodelete ? Infinity : 1;
    dso.global = flags2.global;
    function loadLibData() {
      if (handle2) {
        var data = LE_HEAP_LOAD_U32((handle2 + 28 >> 2) * 4);
        var dataSize = LE_HEAP_LOAD_U32((handle2 + 32 >> 2) * 4);
        if (data && dataSize) {
          var libData = HEAP8.slice(data, data + dataSize);
          return flags2.loadAsync ? Promise.resolve(libData) : libData;
        }
      }
      var libFile = locateFile(libName2);
      if (flags2.loadAsync) {
        return asyncLoad(libFile);
      }
      if (!readBinary) {
        throw new Error(`${libFile}: file not found, and synchronous loading of external files is not available`);
      }
      return readBinary(libFile);
    }
    __name(loadLibData, "loadLibData");
    function getExports() {
      if (flags2.loadAsync) {
        return loadLibData().then((libData) => loadWebAssemblyModule(libData, flags2, libName2, localScope2, handle2));
      }
      return loadWebAssemblyModule(loadLibData(), flags2, libName2, localScope2, handle2);
    }
    __name(getExports, "getExports");
    function moduleLoaded(exports) {
      if (dso.global) {
        mergeLibSymbols(exports, libName2);
      } else if (localScope2) {
        Object.assign(localScope2, exports);
      }
      dso.exports = exports;
    }
    __name(moduleLoaded, "moduleLoaded");
    if (flags2.loadAsync) {
      return getExports().then((exports) => {
        moduleLoaded(exports);
        return true;
      });
    }
    moduleLoaded(getExports());
    return true;
  }
  __name(loadDynamicLibrary, "loadDynamicLibrary");
  var reportUndefinedSymbols = /* @__PURE__ */ __name(() => {
    for (var [symName, entry] of Object.entries(GOT)) {
      if (entry.value == 0) {
        var value = resolveGlobalSymbol(symName, true).sym;
        if (!value && !entry.required) {
          continue;
        }
        if (typeof value == "function") {
          entry.value = addFunction(value, value.sig);
        } else if (typeof value == "number") {
          entry.value = value;
        } else {
          throw new Error(`bad export type for '${symName}': ${typeof value}`);
        }
      }
    }
  }, "reportUndefinedSymbols");
  var runDependencies = 0;
  var dependenciesFulfilled = null;
  var removeRunDependency = /* @__PURE__ */ __name((id) => {
    runDependencies--;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (runDependencies == 0) {
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback();
      }
    }
  }, "removeRunDependency");
  var addRunDependency = /* @__PURE__ */ __name((id) => {
    runDependencies++;
    Module["monitorRunDependencies"]?.(runDependencies);
  }, "addRunDependency");
  var loadDylibs = /* @__PURE__ */ __name(async () => {
    if (!dynamicLibraries.length) {
      reportUndefinedSymbols();
      return;
    }
    addRunDependency("loadDylibs");
    for (var lib of dynamicLibraries) {
      await loadDynamicLibrary(lib, {
        loadAsync: true,
        global: true,
        nodelete: true,
        allowUndefined: true
      });
    }
    reportUndefinedSymbols();
    removeRunDependency("loadDylibs");
  }, "loadDylibs");
  var noExitRuntime = true;
  function setValue(ptr, value, type = "i8") {
    if (type.endsWith("*")) type = "*";
    switch (type) {
      case "i1":
        HEAP8[ptr] = value;
        break;
      case "i8":
        HEAP8[ptr] = value;
        break;
      case "i16":
        LE_HEAP_STORE_I16((ptr >> 1) * 2, value);
        break;
      case "i32":
        LE_HEAP_STORE_I32((ptr >> 2) * 4, value);
        break;
      case "i64":
        LE_HEAP_STORE_I64((ptr >> 3) * 8, BigInt(value));
        break;
      case "float":
        LE_HEAP_STORE_F32((ptr >> 2) * 4, value);
        break;
      case "double":
        LE_HEAP_STORE_F64((ptr >> 3) * 8, value);
        break;
      case "*":
        LE_HEAP_STORE_U32((ptr >> 2) * 4, value);
        break;
      default:
        abort(`invalid type for setValue: ${type}`);
    }
  }
  __name(setValue, "setValue");
  var ___memory_base = new WebAssembly.Global({
    "value": "i32",
    "mutable": false
  }, 1024);
  var ___stack_high = 82240;
  var ___stack_low = 16704;
  var ___stack_pointer = new WebAssembly.Global({
    "value": "i32",
    "mutable": true
  }, 82240);
  var ___table_base = new WebAssembly.Global({
    "value": "i32",
    "mutable": false
  }, 1);
  var __abort_js = /* @__PURE__ */ __name(() => abort(""), "__abort_js");
  __abort_js.sig = "v";
  var getHeapMax = /* @__PURE__ */ __name(() => (
    // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
    // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
    // for any code that deals with heap sizes, which would require special
    // casing all heap size related code to treat 0 specially.
    2147483648
  ), "getHeapMax");
  var growMemory = /* @__PURE__ */ __name((size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {
    }
  }, "growMemory");
  var _emscripten_resize_heap = /* @__PURE__ */ __name((requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  }, "_emscripten_resize_heap");
  _emscripten_resize_heap.sig = "ip";
  var _fd_close = /* @__PURE__ */ __name((fd) => 52, "_fd_close");
  _fd_close.sig = "ii";
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = /* @__PURE__ */ __name((num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num), "bigintToI53Checked");
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    return 70;
  }
  __name(_fd_seek, "_fd_seek");
  _fd_seek.sig = "iijip";
  var printCharBuffers = [null, [], []];
  var printChar = /* @__PURE__ */ __name((stream, curr) => {
    var buffer = printCharBuffers[stream];
    if (curr === 0 || curr === 10) {
      (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
      buffer.length = 0;
    } else {
      buffer.push(curr);
    }
  }, "printChar");
  var _fd_write = /* @__PURE__ */ __name((fd, iov, iovcnt, pnum) => {
    var num = 0;
    for (var i2 = 0; i2 < iovcnt; i2++) {
      var ptr = LE_HEAP_LOAD_U32((iov >> 2) * 4);
      var len = LE_HEAP_LOAD_U32((iov + 4 >> 2) * 4);
      iov += 8;
      for (var j = 0; j < len; j++) {
        printChar(fd, HEAPU8[ptr + j]);
      }
      num += len;
    }
    LE_HEAP_STORE_U32((pnum >> 2) * 4, num);
    return 0;
  }, "_fd_write");
  _fd_write.sig = "iippp";
  function _tree_sitter_log_callback(isLexMessage, messageAddress) {
    if (Module.currentLogCallback) {
      const message = UTF8ToString(messageAddress);
      Module.currentLogCallback(message, isLexMessage !== 0);
    }
  }
  __name(_tree_sitter_log_callback, "_tree_sitter_log_callback");
  function _tree_sitter_parse_callback(inputBufferAddress, index, row, column, lengthAddress) {
    const INPUT_BUFFER_SIZE = 10 * 1024;
    const string = Module.currentParseCallback(index, {
      row,
      column
    });
    if (typeof string === "string") {
      setValue(lengthAddress, string.length, "i32");
      stringToUTF16(string, inputBufferAddress, INPUT_BUFFER_SIZE);
    } else {
      setValue(lengthAddress, 0, "i32");
    }
  }
  __name(_tree_sitter_parse_callback, "_tree_sitter_parse_callback");
  function _tree_sitter_progress_callback(currentOffset, hasError) {
    if (Module.currentProgressCallback) {
      return Module.currentProgressCallback({
        currentOffset,
        hasError
      });
    }
    return false;
  }
  __name(_tree_sitter_progress_callback, "_tree_sitter_progress_callback");
  function _tree_sitter_query_progress_callback(currentOffset) {
    if (Module.currentQueryProgressCallback) {
      return Module.currentQueryProgressCallback({
        currentOffset
      });
    }
    return false;
  }
  __name(_tree_sitter_query_progress_callback, "_tree_sitter_query_progress_callback");
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = /* @__PURE__ */ __name(() => noExitRuntime || runtimeKeepaliveCounter > 0, "keepRuntimeAlive");
  var _proc_exit = /* @__PURE__ */ __name((code) => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
      Module["onExit"]?.(code);
      ABORT = true;
    }
    quit_(code, new ExitStatus(code));
  }, "_proc_exit");
  _proc_exit.sig = "vi";
  var exitJS = /* @__PURE__ */ __name((status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status);
  }, "exitJS");
  var handleException = /* @__PURE__ */ __name((e) => {
    if (e instanceof ExitStatus || e == "unwind") {
      return EXITSTATUS;
    }
    quit_(1, e);
  }, "handleException");
  var lengthBytesUTF8 = /* @__PURE__ */ __name((str) => {
    var len = 0;
    for (var i2 = 0; i2 < str.length; ++i2) {
      var c = str.charCodeAt(i2);
      if (c <= 127) {
        len++;
      } else if (c <= 2047) {
        len += 2;
      } else if (c >= 55296 && c <= 57343) {
        len += 4;
        ++i2;
      } else {
        len += 3;
      }
    }
    return len;
  }, "lengthBytesUTF8");
  var stringToUTF8Array = /* @__PURE__ */ __name((str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i2 = 0; i2 < str.length; ++i2) {
      var u = str.codePointAt(i2);
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 192 | u >> 6;
        heap[outIdx++] = 128 | u & 63;
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 224 | u >> 12;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63;
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 240 | u >> 18;
        heap[outIdx++] = 128 | u >> 12 & 63;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63;
        i2++;
      }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
  }, "stringToUTF8Array");
  var stringToUTF8 = /* @__PURE__ */ __name((str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite), "stringToUTF8");
  var stackAlloc = /* @__PURE__ */ __name((sz) => __emscripten_stack_alloc(sz), "stackAlloc");
  var stringToUTF8OnStack = /* @__PURE__ */ __name((str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
  }, "stringToUTF8OnStack");
  var AsciiToString = /* @__PURE__ */ __name((ptr) => {
    var str = "";
    while (1) {
      var ch = HEAPU8[ptr++];
      if (!ch) return str;
      str += String.fromCharCode(ch);
    }
  }, "AsciiToString");
  var stringToUTF16 = /* @__PURE__ */ __name((str, outPtr, maxBytesToWrite) => {
    maxBytesToWrite ??= 2147483647;
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i2 = 0; i2 < numCharsToWrite; ++i2) {
      var codeUnit = str.charCodeAt(i2);
      LE_HEAP_STORE_I16((outPtr >> 1) * 2, codeUnit);
      outPtr += 2;
    }
    LE_HEAP_STORE_I16((outPtr >> 1) * 2, 0);
    return outPtr - startPtr;
  }, "stringToUTF16");
  LE_ATOMICS_NATIVE_BYTE_ORDER = new Int8Array(new Int16Array([1]).buffer)[0] === 1 ? [
    /* little endian */
    ((x) => x),
    ((x) => x),
    void 0,
    ((x) => x)
  ] : [
    /* big endian */
    ((x) => x),
    ((x) => ((x & 65280) << 8 | (x & 255) << 24) >> 16),
    void 0,
    ((x) => x >> 24 & 255 | x >> 8 & 65280 | (x & 65280) << 8 | (x & 255) << 24)
  ];
  function LE_HEAP_UPDATE() {
    HEAPU16.unsigned = ((x) => x & 65535);
    HEAPU32.unsigned = ((x) => x >>> 0);
  }
  __name(LE_HEAP_UPDATE, "LE_HEAP_UPDATE");
  {
    initMemory();
    if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
    if (Module["print"]) out = Module["print"];
    if (Module["printErr"]) err = Module["printErr"];
    if (Module["dynamicLibraries"]) dynamicLibraries = Module["dynamicLibraries"];
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].shift()();
      }
    }
  }
  Module["setValue"] = setValue;
  Module["getValue"] = getValue;
  Module["UTF8ToString"] = UTF8ToString;
  Module["stringToUTF8"] = stringToUTF8;
  Module["lengthBytesUTF8"] = lengthBytesUTF8;
  Module["AsciiToString"] = AsciiToString;
  Module["stringToUTF16"] = stringToUTF16;
  Module["loadWebAssemblyModule"] = loadWebAssemblyModule;
  Module["LE_HEAP_STORE_I64"] = LE_HEAP_STORE_I64;
  var ASM_CONSTS = {};
  var _malloc, _calloc, _realloc, _free, _ts_range_edit, _memcmp, _ts_language_symbol_count, _ts_language_state_count, _ts_language_abi_version, _ts_language_name, _ts_language_field_count, _ts_language_next_state, _ts_language_symbol_name, _ts_language_symbol_for_name, _strncmp, _ts_language_symbol_type, _ts_language_field_name_for_id, _ts_lookahead_iterator_new, _ts_lookahead_iterator_delete, _ts_lookahead_iterator_reset_state, _ts_lookahead_iterator_reset, _ts_lookahead_iterator_next, _ts_lookahead_iterator_current_symbol, _ts_point_edit, _ts_parser_delete, _ts_parser_reset, _ts_parser_set_language, _ts_parser_set_included_ranges, _ts_query_new, _ts_query_delete, _iswspace, _iswalnum, _ts_query_copy, _ts_query_pattern_count, _ts_query_capture_count, _ts_query_string_count, _ts_query_capture_name_for_id, _ts_query_capture_quantifier_for_id, _ts_query_string_value_for_id, _ts_query_predicates_for_pattern, _ts_query_start_byte_for_pattern, _ts_query_end_byte_for_pattern, _ts_query_is_pattern_rooted, _ts_query_is_pattern_non_local, _ts_query_is_pattern_guaranteed_at_step, _ts_query_disable_capture, _ts_query_disable_pattern, _ts_tree_copy, _ts_tree_delete, _ts_init, _ts_parser_new_wasm, _ts_parser_enable_logger_wasm, _ts_parser_parse_wasm, _ts_parser_included_ranges_wasm, _ts_language_type_is_named_wasm, _ts_language_type_is_visible_wasm, _ts_language_metadata_wasm, _ts_language_supertypes_wasm, _ts_language_subtypes_wasm, _ts_tree_root_node_wasm, _ts_tree_root_node_with_offset_wasm, _ts_tree_edit_wasm, _ts_tree_included_ranges_wasm, _ts_tree_get_changed_ranges_wasm, _ts_tree_cursor_new_wasm, _ts_tree_cursor_copy_wasm, _ts_tree_cursor_delete_wasm, _ts_tree_cursor_reset_wasm, _ts_tree_cursor_reset_to_wasm, _ts_tree_cursor_goto_first_child_wasm, _ts_tree_cursor_goto_last_child_wasm, _ts_tree_cursor_goto_first_child_for_index_wasm, _ts_tree_cursor_goto_first_child_for_position_wasm, _ts_tree_cursor_goto_next_sibling_wasm, _ts_tree_cursor_goto_previous_sibling_wasm, _ts_tree_cursor_goto_descendant_wasm, _ts_tree_cursor_goto_parent_wasm, _ts_tree_cursor_current_node_type_id_wasm, _ts_tree_cursor_current_node_state_id_wasm, _ts_tree_cursor_current_node_is_named_wasm, _ts_tree_cursor_current_node_is_missing_wasm, _ts_tree_cursor_current_node_id_wasm, _ts_tree_cursor_start_position_wasm, _ts_tree_cursor_end_position_wasm, _ts_tree_cursor_start_index_wasm, _ts_tree_cursor_end_index_wasm, _ts_tree_cursor_current_field_id_wasm, _ts_tree_cursor_current_depth_wasm, _ts_tree_cursor_current_descendant_index_wasm, _ts_tree_cursor_current_node_wasm, _ts_node_symbol_wasm, _ts_node_field_name_for_child_wasm, _ts_node_field_name_for_named_child_wasm, _ts_node_children_by_field_id_wasm, _ts_node_first_child_for_byte_wasm, _ts_node_first_named_child_for_byte_wasm, _ts_node_grammar_symbol_wasm, _ts_node_child_count_wasm, _ts_node_named_child_count_wasm, _ts_node_child_wasm, _ts_node_named_child_wasm, _ts_node_child_by_field_id_wasm, _ts_node_next_sibling_wasm, _ts_node_prev_sibling_wasm, _ts_node_next_named_sibling_wasm, _ts_node_prev_named_sibling_wasm, _ts_node_descendant_count_wasm, _ts_node_parent_wasm, _ts_node_child_with_descendant_wasm, _ts_node_descendant_for_index_wasm, _ts_node_named_descendant_for_index_wasm, _ts_node_descendant_for_position_wasm, _ts_node_named_descendant_for_position_wasm, _ts_node_start_point_wasm, _ts_node_end_point_wasm, _ts_node_start_index_wasm, _ts_node_end_index_wasm, _ts_node_to_string_wasm, _ts_node_children_wasm, _ts_node_named_children_wasm, _ts_node_descendants_of_type_wasm, _ts_node_is_named_wasm, _ts_node_has_changes_wasm, _ts_node_has_error_wasm, _ts_node_is_error_wasm, _ts_node_is_missing_wasm, _ts_node_is_extra_wasm, _ts_node_parse_state_wasm, _ts_node_next_parse_state_wasm, _ts_query_matches_wasm, _ts_query_captures_wasm, _memset, _memcpy, _memmove, _iswalpha, _iswblank, _iswdigit, _iswlower, _iswpunct, _iswupper, _iswxdigit, _memchr, _strlen, _strcmp, _strncat, _strncpy, _towlower, _towupper, _setThrew, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, ___wasm_apply_data_relocs;
  function assignWasmExports(wasmExports2) {
    Module["_malloc"] = _malloc = wasmExports2["malloc"];
    Module["_calloc"] = _calloc = wasmExports2["calloc"];
    Module["_realloc"] = _realloc = wasmExports2["realloc"];
    Module["_free"] = _free = wasmExports2["free"];
    Module["_ts_range_edit"] = _ts_range_edit = wasmExports2["ts_range_edit"];
    Module["_memcmp"] = _memcmp = wasmExports2["memcmp"];
    Module["_ts_language_symbol_count"] = _ts_language_symbol_count = wasmExports2["ts_language_symbol_count"];
    Module["_ts_language_state_count"] = _ts_language_state_count = wasmExports2["ts_language_state_count"];
    Module["_ts_language_abi_version"] = _ts_language_abi_version = wasmExports2["ts_language_abi_version"];
    Module["_ts_language_name"] = _ts_language_name = wasmExports2["ts_language_name"];
    Module["_ts_language_field_count"] = _ts_language_field_count = wasmExports2["ts_language_field_count"];
    Module["_ts_language_next_state"] = _ts_language_next_state = wasmExports2["ts_language_next_state"];
    Module["_ts_language_symbol_name"] = _ts_language_symbol_name = wasmExports2["ts_language_symbol_name"];
    Module["_ts_language_symbol_for_name"] = _ts_language_symbol_for_name = wasmExports2["ts_language_symbol_for_name"];
    Module["_strncmp"] = _strncmp = wasmExports2["strncmp"];
    Module["_ts_language_symbol_type"] = _ts_language_symbol_type = wasmExports2["ts_language_symbol_type"];
    Module["_ts_language_field_name_for_id"] = _ts_language_field_name_for_id = wasmExports2["ts_language_field_name_for_id"];
    Module["_ts_lookahead_iterator_new"] = _ts_lookahead_iterator_new = wasmExports2["ts_lookahead_iterator_new"];
    Module["_ts_lookahead_iterator_delete"] = _ts_lookahead_iterator_delete = wasmExports2["ts_lookahead_iterator_delete"];
    Module["_ts_lookahead_iterator_reset_state"] = _ts_lookahead_iterator_reset_state = wasmExports2["ts_lookahead_iterator_reset_state"];
    Module["_ts_lookahead_iterator_reset"] = _ts_lookahead_iterator_reset = wasmExports2["ts_lookahead_iterator_reset"];
    Module["_ts_lookahead_iterator_next"] = _ts_lookahead_iterator_next = wasmExports2["ts_lookahead_iterator_next"];
    Module["_ts_lookahead_iterator_current_symbol"] = _ts_lookahead_iterator_current_symbol = wasmExports2["ts_lookahead_iterator_current_symbol"];
    Module["_ts_point_edit"] = _ts_point_edit = wasmExports2["ts_point_edit"];
    Module["_ts_parser_delete"] = _ts_parser_delete = wasmExports2["ts_parser_delete"];
    Module["_ts_parser_reset"] = _ts_parser_reset = wasmExports2["ts_parser_reset"];
    Module["_ts_parser_set_language"] = _ts_parser_set_language = wasmExports2["ts_parser_set_language"];
    Module["_ts_parser_set_included_ranges"] = _ts_parser_set_included_ranges = wasmExports2["ts_parser_set_included_ranges"];
    Module["_ts_query_new"] = _ts_query_new = wasmExports2["ts_query_new"];
    Module["_ts_query_delete"] = _ts_query_delete = wasmExports2["ts_query_delete"];
    Module["_iswspace"] = _iswspace = wasmExports2["iswspace"];
    Module["_iswalnum"] = _iswalnum = wasmExports2["iswalnum"];
    Module["_ts_query_copy"] = _ts_query_copy = wasmExports2["ts_query_copy"];
    Module["_ts_query_pattern_count"] = _ts_query_pattern_count = wasmExports2["ts_query_pattern_count"];
    Module["_ts_query_capture_count"] = _ts_query_capture_count = wasmExports2["ts_query_capture_count"];
    Module["_ts_query_string_count"] = _ts_query_string_count = wasmExports2["ts_query_string_count"];
    Module["_ts_query_capture_name_for_id"] = _ts_query_capture_name_for_id = wasmExports2["ts_query_capture_name_for_id"];
    Module["_ts_query_capture_quantifier_for_id"] = _ts_query_capture_quantifier_for_id = wasmExports2["ts_query_capture_quantifier_for_id"];
    Module["_ts_query_string_value_for_id"] = _ts_query_string_value_for_id = wasmExports2["ts_query_string_value_for_id"];
    Module["_ts_query_predicates_for_pattern"] = _ts_query_predicates_for_pattern = wasmExports2["ts_query_predicates_for_pattern"];
    Module["_ts_query_start_byte_for_pattern"] = _ts_query_start_byte_for_pattern = wasmExports2["ts_query_start_byte_for_pattern"];
    Module["_ts_query_end_byte_for_pattern"] = _ts_query_end_byte_for_pattern = wasmExports2["ts_query_end_byte_for_pattern"];
    Module["_ts_query_is_pattern_rooted"] = _ts_query_is_pattern_rooted = wasmExports2["ts_query_is_pattern_rooted"];
    Module["_ts_query_is_pattern_non_local"] = _ts_query_is_pattern_non_local = wasmExports2["ts_query_is_pattern_non_local"];
    Module["_ts_query_is_pattern_guaranteed_at_step"] = _ts_query_is_pattern_guaranteed_at_step = wasmExports2["ts_query_is_pattern_guaranteed_at_step"];
    Module["_ts_query_disable_capture"] = _ts_query_disable_capture = wasmExports2["ts_query_disable_capture"];
    Module["_ts_query_disable_pattern"] = _ts_query_disable_pattern = wasmExports2["ts_query_disable_pattern"];
    Module["_ts_tree_copy"] = _ts_tree_copy = wasmExports2["ts_tree_copy"];
    Module["_ts_tree_delete"] = _ts_tree_delete = wasmExports2["ts_tree_delete"];
    Module["_ts_init"] = _ts_init = wasmExports2["ts_init"];
    Module["_ts_parser_new_wasm"] = _ts_parser_new_wasm = wasmExports2["ts_parser_new_wasm"];
    Module["_ts_parser_enable_logger_wasm"] = _ts_parser_enable_logger_wasm = wasmExports2["ts_parser_enable_logger_wasm"];
    Module["_ts_parser_parse_wasm"] = _ts_parser_parse_wasm = wasmExports2["ts_parser_parse_wasm"];
    Module["_ts_parser_included_ranges_wasm"] = _ts_parser_included_ranges_wasm = wasmExports2["ts_parser_included_ranges_wasm"];
    Module["_ts_language_type_is_named_wasm"] = _ts_language_type_is_named_wasm = wasmExports2["ts_language_type_is_named_wasm"];
    Module["_ts_language_type_is_visible_wasm"] = _ts_language_type_is_visible_wasm = wasmExports2["ts_language_type_is_visible_wasm"];
    Module["_ts_language_metadata_wasm"] = _ts_language_metadata_wasm = wasmExports2["ts_language_metadata_wasm"];
    Module["_ts_language_supertypes_wasm"] = _ts_language_supertypes_wasm = wasmExports2["ts_language_supertypes_wasm"];
    Module["_ts_language_subtypes_wasm"] = _ts_language_subtypes_wasm = wasmExports2["ts_language_subtypes_wasm"];
    Module["_ts_tree_root_node_wasm"] = _ts_tree_root_node_wasm = wasmExports2["ts_tree_root_node_wasm"];
    Module["_ts_tree_root_node_with_offset_wasm"] = _ts_tree_root_node_with_offset_wasm = wasmExports2["ts_tree_root_node_with_offset_wasm"];
    Module["_ts_tree_edit_wasm"] = _ts_tree_edit_wasm = wasmExports2["ts_tree_edit_wasm"];
    Module["_ts_tree_included_ranges_wasm"] = _ts_tree_included_ranges_wasm = wasmExports2["ts_tree_included_ranges_wasm"];
    Module["_ts_tree_get_changed_ranges_wasm"] = _ts_tree_get_changed_ranges_wasm = wasmExports2["ts_tree_get_changed_ranges_wasm"];
    Module["_ts_tree_cursor_new_wasm"] = _ts_tree_cursor_new_wasm = wasmExports2["ts_tree_cursor_new_wasm"];
    Module["_ts_tree_cursor_copy_wasm"] = _ts_tree_cursor_copy_wasm = wasmExports2["ts_tree_cursor_copy_wasm"];
    Module["_ts_tree_cursor_delete_wasm"] = _ts_tree_cursor_delete_wasm = wasmExports2["ts_tree_cursor_delete_wasm"];
    Module["_ts_tree_cursor_reset_wasm"] = _ts_tree_cursor_reset_wasm = wasmExports2["ts_tree_cursor_reset_wasm"];
    Module["_ts_tree_cursor_reset_to_wasm"] = _ts_tree_cursor_reset_to_wasm = wasmExports2["ts_tree_cursor_reset_to_wasm"];
    Module["_ts_tree_cursor_goto_first_child_wasm"] = _ts_tree_cursor_goto_first_child_wasm = wasmExports2["ts_tree_cursor_goto_first_child_wasm"];
    Module["_ts_tree_cursor_goto_last_child_wasm"] = _ts_tree_cursor_goto_last_child_wasm = wasmExports2["ts_tree_cursor_goto_last_child_wasm"];
    Module["_ts_tree_cursor_goto_first_child_for_index_wasm"] = _ts_tree_cursor_goto_first_child_for_index_wasm = wasmExports2["ts_tree_cursor_goto_first_child_for_index_wasm"];
    Module["_ts_tree_cursor_goto_first_child_for_position_wasm"] = _ts_tree_cursor_goto_first_child_for_position_wasm = wasmExports2["ts_tree_cursor_goto_first_child_for_position_wasm"];
    Module["_ts_tree_cursor_goto_next_sibling_wasm"] = _ts_tree_cursor_goto_next_sibling_wasm = wasmExports2["ts_tree_cursor_goto_next_sibling_wasm"];
    Module["_ts_tree_cursor_goto_previous_sibling_wasm"] = _ts_tree_cursor_goto_previous_sibling_wasm = wasmExports2["ts_tree_cursor_goto_previous_sibling_wasm"];
    Module["_ts_tree_cursor_goto_descendant_wasm"] = _ts_tree_cursor_goto_descendant_wasm = wasmExports2["ts_tree_cursor_goto_descendant_wasm"];
    Module["_ts_tree_cursor_goto_parent_wasm"] = _ts_tree_cursor_goto_parent_wasm = wasmExports2["ts_tree_cursor_goto_parent_wasm"];
    Module["_ts_tree_cursor_current_node_type_id_wasm"] = _ts_tree_cursor_current_node_type_id_wasm = wasmExports2["ts_tree_cursor_current_node_type_id_wasm"];
    Module["_ts_tree_cursor_current_node_state_id_wasm"] = _ts_tree_cursor_current_node_state_id_wasm = wasmExports2["ts_tree_cursor_current_node_state_id_wasm"];
    Module["_ts_tree_cursor_current_node_is_named_wasm"] = _ts_tree_cursor_current_node_is_named_wasm = wasmExports2["ts_tree_cursor_current_node_is_named_wasm"];
    Module["_ts_tree_cursor_current_node_is_missing_wasm"] = _ts_tree_cursor_current_node_is_missing_wasm = wasmExports2["ts_tree_cursor_current_node_is_missing_wasm"];
    Module["_ts_tree_cursor_current_node_id_wasm"] = _ts_tree_cursor_current_node_id_wasm = wasmExports2["ts_tree_cursor_current_node_id_wasm"];
    Module["_ts_tree_cursor_start_position_wasm"] = _ts_tree_cursor_start_position_wasm = wasmExports2["ts_tree_cursor_start_position_wasm"];
    Module["_ts_tree_cursor_end_position_wasm"] = _ts_tree_cursor_end_position_wasm = wasmExports2["ts_tree_cursor_end_position_wasm"];
    Module["_ts_tree_cursor_start_index_wasm"] = _ts_tree_cursor_start_index_wasm = wasmExports2["ts_tree_cursor_start_index_wasm"];
    Module["_ts_tree_cursor_end_index_wasm"] = _ts_tree_cursor_end_index_wasm = wasmExports2["ts_tree_cursor_end_index_wasm"];
    Module["_ts_tree_cursor_current_field_id_wasm"] = _ts_tree_cursor_current_field_id_wasm = wasmExports2["ts_tree_cursor_current_field_id_wasm"];
    Module["_ts_tree_cursor_current_depth_wasm"] = _ts_tree_cursor_current_depth_wasm = wasmExports2["ts_tree_cursor_current_depth_wasm"];
    Module["_ts_tree_cursor_current_descendant_index_wasm"] = _ts_tree_cursor_current_descendant_index_wasm = wasmExports2["ts_tree_cursor_current_descendant_index_wasm"];
    Module["_ts_tree_cursor_current_node_wasm"] = _ts_tree_cursor_current_node_wasm = wasmExports2["ts_tree_cursor_current_node_wasm"];
    Module["_ts_node_symbol_wasm"] = _ts_node_symbol_wasm = wasmExports2["ts_node_symbol_wasm"];
    Module["_ts_node_field_name_for_child_wasm"] = _ts_node_field_name_for_child_wasm = wasmExports2["ts_node_field_name_for_child_wasm"];
    Module["_ts_node_field_name_for_named_child_wasm"] = _ts_node_field_name_for_named_child_wasm = wasmExports2["ts_node_field_name_for_named_child_wasm"];
    Module["_ts_node_children_by_field_id_wasm"] = _ts_node_children_by_field_id_wasm = wasmExports2["ts_node_children_by_field_id_wasm"];
    Module["_ts_node_first_child_for_byte_wasm"] = _ts_node_first_child_for_byte_wasm = wasmExports2["ts_node_first_child_for_byte_wasm"];
    Module["_ts_node_first_named_child_for_byte_wasm"] = _ts_node_first_named_child_for_byte_wasm = wasmExports2["ts_node_first_named_child_for_byte_wasm"];
    Module["_ts_node_grammar_symbol_wasm"] = _ts_node_grammar_symbol_wasm = wasmExports2["ts_node_grammar_symbol_wasm"];
    Module["_ts_node_child_count_wasm"] = _ts_node_child_count_wasm = wasmExports2["ts_node_child_count_wasm"];
    Module["_ts_node_named_child_count_wasm"] = _ts_node_named_child_count_wasm = wasmExports2["ts_node_named_child_count_wasm"];
    Module["_ts_node_child_wasm"] = _ts_node_child_wasm = wasmExports2["ts_node_child_wasm"];
    Module["_ts_node_named_child_wasm"] = _ts_node_named_child_wasm = wasmExports2["ts_node_named_child_wasm"];
    Module["_ts_node_child_by_field_id_wasm"] = _ts_node_child_by_field_id_wasm = wasmExports2["ts_node_child_by_field_id_wasm"];
    Module["_ts_node_next_sibling_wasm"] = _ts_node_next_sibling_wasm = wasmExports2["ts_node_next_sibling_wasm"];
    Module["_ts_node_prev_sibling_wasm"] = _ts_node_prev_sibling_wasm = wasmExports2["ts_node_prev_sibling_wasm"];
    Module["_ts_node_next_named_sibling_wasm"] = _ts_node_next_named_sibling_wasm = wasmExports2["ts_node_next_named_sibling_wasm"];
    Module["_ts_node_prev_named_sibling_wasm"] = _ts_node_prev_named_sibling_wasm = wasmExports2["ts_node_prev_named_sibling_wasm"];
    Module["_ts_node_descendant_count_wasm"] = _ts_node_descendant_count_wasm = wasmExports2["ts_node_descendant_count_wasm"];
    Module["_ts_node_parent_wasm"] = _ts_node_parent_wasm = wasmExports2["ts_node_parent_wasm"];
    Module["_ts_node_child_with_descendant_wasm"] = _ts_node_child_with_descendant_wasm = wasmExports2["ts_node_child_with_descendant_wasm"];
    Module["_ts_node_descendant_for_index_wasm"] = _ts_node_descendant_for_index_wasm = wasmExports2["ts_node_descendant_for_index_wasm"];
    Module["_ts_node_named_descendant_for_index_wasm"] = _ts_node_named_descendant_for_index_wasm = wasmExports2["ts_node_named_descendant_for_index_wasm"];
    Module["_ts_node_descendant_for_position_wasm"] = _ts_node_descendant_for_position_wasm = wasmExports2["ts_node_descendant_for_position_wasm"];
    Module["_ts_node_named_descendant_for_position_wasm"] = _ts_node_named_descendant_for_position_wasm = wasmExports2["ts_node_named_descendant_for_position_wasm"];
    Module["_ts_node_start_point_wasm"] = _ts_node_start_point_wasm = wasmExports2["ts_node_start_point_wasm"];
    Module["_ts_node_end_point_wasm"] = _ts_node_end_point_wasm = wasmExports2["ts_node_end_point_wasm"];
    Module["_ts_node_start_index_wasm"] = _ts_node_start_index_wasm = wasmExports2["ts_node_start_index_wasm"];
    Module["_ts_node_end_index_wasm"] = _ts_node_end_index_wasm = wasmExports2["ts_node_end_index_wasm"];
    Module["_ts_node_to_string_wasm"] = _ts_node_to_string_wasm = wasmExports2["ts_node_to_string_wasm"];
    Module["_ts_node_children_wasm"] = _ts_node_children_wasm = wasmExports2["ts_node_children_wasm"];
    Module["_ts_node_named_children_wasm"] = _ts_node_named_children_wasm = wasmExports2["ts_node_named_children_wasm"];
    Module["_ts_node_descendants_of_type_wasm"] = _ts_node_descendants_of_type_wasm = wasmExports2["ts_node_descendants_of_type_wasm"];
    Module["_ts_node_is_named_wasm"] = _ts_node_is_named_wasm = wasmExports2["ts_node_is_named_wasm"];
    Module["_ts_node_has_changes_wasm"] = _ts_node_has_changes_wasm = wasmExports2["ts_node_has_changes_wasm"];
    Module["_ts_node_has_error_wasm"] = _ts_node_has_error_wasm = wasmExports2["ts_node_has_error_wasm"];
    Module["_ts_node_is_error_wasm"] = _ts_node_is_error_wasm = wasmExports2["ts_node_is_error_wasm"];
    Module["_ts_node_is_missing_wasm"] = _ts_node_is_missing_wasm = wasmExports2["ts_node_is_missing_wasm"];
    Module["_ts_node_is_extra_wasm"] = _ts_node_is_extra_wasm = wasmExports2["ts_node_is_extra_wasm"];
    Module["_ts_node_parse_state_wasm"] = _ts_node_parse_state_wasm = wasmExports2["ts_node_parse_state_wasm"];
    Module["_ts_node_next_parse_state_wasm"] = _ts_node_next_parse_state_wasm = wasmExports2["ts_node_next_parse_state_wasm"];
    Module["_ts_query_matches_wasm"] = _ts_query_matches_wasm = wasmExports2["ts_query_matches_wasm"];
    Module["_ts_query_captures_wasm"] = _ts_query_captures_wasm = wasmExports2["ts_query_captures_wasm"];
    Module["_memset"] = _memset = wasmExports2["memset"];
    Module["_memcpy"] = _memcpy = wasmExports2["memcpy"];
    Module["_memmove"] = _memmove = wasmExports2["memmove"];
    Module["_iswalpha"] = _iswalpha = wasmExports2["iswalpha"];
    Module["_iswblank"] = _iswblank = wasmExports2["iswblank"];
    Module["_iswdigit"] = _iswdigit = wasmExports2["iswdigit"];
    Module["_iswlower"] = _iswlower = wasmExports2["iswlower"];
    Module["_iswpunct"] = _iswpunct = wasmExports2["iswpunct"];
    Module["_iswupper"] = _iswupper = wasmExports2["iswupper"];
    Module["_iswxdigit"] = _iswxdigit = wasmExports2["iswxdigit"];
    Module["_memchr"] = _memchr = wasmExports2["memchr"];
    Module["_strlen"] = _strlen = wasmExports2["strlen"];
    Module["_strcmp"] = _strcmp = wasmExports2["strcmp"];
    Module["_strncat"] = _strncat = wasmExports2["strncat"];
    Module["_strncpy"] = _strncpy = wasmExports2["strncpy"];
    Module["_towlower"] = _towlower = wasmExports2["towlower"];
    Module["_towupper"] = _towupper = wasmExports2["towupper"];
    _setThrew = wasmExports2["setThrew"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    ___wasm_apply_data_relocs = wasmExports2["__wasm_apply_data_relocs"];
  }
  __name(assignWasmExports, "assignWasmExports");
  var wasmImports = {
    /** @export */
    __heap_base: ___heap_base,
    /** @export */
    __indirect_function_table: wasmTable,
    /** @export */
    __memory_base: ___memory_base,
    /** @export */
    __stack_high: ___stack_high,
    /** @export */
    __stack_low: ___stack_low,
    /** @export */
    __stack_pointer: ___stack_pointer,
    /** @export */
    __table_base: ___table_base,
    /** @export */
    _abort_js: __abort_js,
    /** @export */
    emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */
    fd_close: _fd_close,
    /** @export */
    fd_seek: _fd_seek,
    /** @export */
    fd_write: _fd_write,
    /** @export */
    memory: wasmMemory,
    /** @export */
    tree_sitter_log_callback: _tree_sitter_log_callback,
    /** @export */
    tree_sitter_parse_callback: _tree_sitter_parse_callback,
    /** @export */
    tree_sitter_progress_callback: _tree_sitter_progress_callback,
    /** @export */
    tree_sitter_query_progress_callback: _tree_sitter_query_progress_callback
  };
  function callMain(args2 = []) {
    var entryFunction = resolveGlobalSymbol("main").sym;
    if (!entryFunction) return;
    args2.unshift(thisProgram);
    var argc = args2.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv;
    args2.forEach((arg) => {
      LE_HEAP_STORE_U32((argv_ptr >> 2) * 4, stringToUTF8OnStack(arg));
      argv_ptr += 4;
    });
    LE_HEAP_STORE_U32((argv_ptr >> 2) * 4, 0);
    try {
      var ret = entryFunction(argc, argv);
      exitJS(
        ret,
        /* implicit = */
        true
      );
      return ret;
    } catch (e) {
      return handleException(e);
    }
  }
  __name(callMain, "callMain");
  function run(args2 = arguments_) {
    if (runDependencies > 0) {
      dependenciesFulfilled = run;
      return;
    }
    preRun();
    if (runDependencies > 0) {
      dependenciesFulfilled = run;
      return;
    }
    function doRun() {
      Module["calledRun"] = true;
      if (ABORT) return;
      initRuntime();
      preMain();
      readyPromiseResolve?.(Module);
      Module["onRuntimeInitialized"]?.();
      var noInitialRun = Module["noInitialRun"] || false;
      if (!noInitialRun) callMain(args2);
      postRun();
    }
    __name(doRun, "doRun");
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(() => {
        setTimeout(() => Module["setStatus"](""), 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  __name(run, "run");
  var wasmExports;
  wasmExports = await createWasm();
  run();
  if (runtimeInitialized) {
    moduleRtn = Module;
  } else {
    moduleRtn = new Promise((resolve2, reject) => {
      readyPromiseResolve = resolve2;
      readyPromiseReject = reject;
    });
  }
  return moduleRtn;
}
__name(Module2, "Module");
var web_tree_sitter_default = Module2;
var Module3 = null;
async function initializeBinding(moduleOptions) {
  return Module3 ??= await web_tree_sitter_default(moduleOptions);
}
__name(initializeBinding, "initializeBinding");
function checkModule() {
  return !!Module3;
}
__name(checkModule, "checkModule");
var TRANSFER_BUFFER;
var LANGUAGE_VERSION;
var MIN_COMPATIBLE_VERSION;
var finalizer4 = newFinalizer((addresses) => {
  C._ts_parser_delete(addresses[0]);
  C._free(addresses[1]);
});
var Parser = class {
  static {
    __name(this, "Parser");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  [1] = 0;
  // Internal handle for Wasm
  /** @internal */
  logCallback = null;
  /** The parser's current language. */
  language = null;
  /**
   * This must always be called before creating a Parser.
   *
   * You can optionally pass in options to configure the Wasm module, the most common
   * one being `locateFile` to help the module find the `.wasm` file.
   */
  static async init(moduleOptions) {
    setModule(await initializeBinding(moduleOptions));
    TRANSFER_BUFFER = C._ts_init();
    LANGUAGE_VERSION = C.getValue(TRANSFER_BUFFER, "i32");
    MIN_COMPATIBLE_VERSION = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
  }
  /**
   * Create a new parser.
   */
  constructor() {
    this.initialize();
    finalizer4?.register(this, [this[0], this[1]], this);
  }
  /** @internal */
  initialize() {
    if (!checkModule()) {
      throw new Error("cannot construct a Parser before calling `init()`");
    }
    C._ts_parser_new_wasm();
    this[0] = C.getValue(TRANSFER_BUFFER, "i32");
    this[1] = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
  }
  /** Delete the parser, freeing its resources. */
  delete() {
    finalizer4?.unregister(this);
    C._ts_parser_delete(this[0]);
    C._free(this[1]);
    this[0] = 0;
    this[1] = 0;
  }
  /**
   * Set the language that the parser should use for parsing.
   *
   * If the language was not successfully assigned, an error will be thrown.
   * This happens if the language was generated with an incompatible
   * version of the Tree-sitter CLI. Check the language's version using
   * {@link Language#version} and compare it to this library's
   * {@link LANGUAGE_VERSION} and {@link MIN_COMPATIBLE_VERSION} constants.
   */
  setLanguage(language) {
    let address;
    if (!language) {
      address = 0;
      this.language = null;
    } else if (language.constructor === Language) {
      address = language[0];
      const version = C._ts_language_abi_version(address);
      if (version < MIN_COMPATIBLE_VERSION || LANGUAGE_VERSION < version) {
        throw new Error(
          `Incompatible language version ${version}. Compatibility range ${MIN_COMPATIBLE_VERSION} through ${LANGUAGE_VERSION}.`
        );
      }
      this.language = language;
    } else {
      throw new Error("Argument must be a Language");
    }
    C._ts_parser_set_language(this[0], address);
    return this;
  }
  /**
   * Parse a slice of UTF8 text.
   *
   * @param {string | ParseCallback} callback - The UTF8-encoded text to parse or a callback function.
   *
   * @param {Tree | null} [oldTree] - A previous syntax tree parsed from the same document. If the text of the
   *   document has changed since `oldTree` was created, then you must edit `oldTree` to match
   *   the new text using {@link Tree#edit}.
   *
   * @param {ParseOptions} [options] - Options for parsing the text.
   *  This can be used to set the included ranges, or a progress callback.
   *
   * @returns {Tree | null} A {@link Tree} if parsing succeeded, or `null` if:
   *  - The parser has not yet had a language assigned with {@link Parser#setLanguage}.
   *  - The progress callback returned true.
   */
  parse(callback, oldTree, options) {
    if (typeof callback === "string") {
      C.currentParseCallback = (index) => callback.slice(index);
    } else if (typeof callback === "function") {
      C.currentParseCallback = callback;
    } else {
      throw new Error("Argument must be a string or a function");
    }
    if (options?.progressCallback) {
      C.currentProgressCallback = options.progressCallback;
    } else {
      C.currentProgressCallback = null;
    }
    if (this.logCallback) {
      C.currentLogCallback = this.logCallback;
      C._ts_parser_enable_logger_wasm(this[0], 1);
    } else {
      C.currentLogCallback = null;
      C._ts_parser_enable_logger_wasm(this[0], 0);
    }
    let rangeCount = 0;
    let rangeAddress = 0;
    if (options?.includedRanges) {
      rangeCount = options.includedRanges.length;
      rangeAddress = C._calloc(rangeCount, SIZE_OF_RANGE);
      let address = rangeAddress;
      for (let i2 = 0; i2 < rangeCount; i2++) {
        marshalRange(address, options.includedRanges[i2]);
        address += SIZE_OF_RANGE;
      }
    }
    const treeAddress = C._ts_parser_parse_wasm(
      this[0],
      this[1],
      oldTree ? oldTree[0] : 0,
      rangeAddress,
      rangeCount
    );
    if (!treeAddress) {
      C.currentParseCallback = null;
      C.currentLogCallback = null;
      C.currentProgressCallback = null;
      return null;
    }
    if (!this.language) {
      throw new Error("Parser must have a language to parse");
    }
    const result = new Tree(INTERNAL, treeAddress, this.language, C.currentParseCallback);
    C.currentParseCallback = null;
    C.currentLogCallback = null;
    C.currentProgressCallback = null;
    return result;
  }
  /**
   * Instruct the parser to start the next parse from the beginning.
   *
   * If the parser previously failed because of a callback, 
   * then by default, it will resume where it left off on the
   * next call to {@link Parser#parse} or other parsing functions.
   * If you don't want to resume, and instead intend to use this parser to
   * parse some other document, you must call `reset` first.
   */
  reset() {
    C._ts_parser_reset(this[0]);
  }
  /** Get the ranges of text that the parser will include when parsing. */
  getIncludedRanges() {
    C._ts_parser_included_ranges_wasm(this[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
      }
      C._free(buffer);
    }
    return result;
  }
  /** Set the logging callback that a parser should use during parsing. */
  setLogger(callback) {
    if (!callback) {
      this.logCallback = null;
    } else if (typeof callback !== "function") {
      throw new Error("Logger callback must be a function");
    } else {
      this.logCallback = callback;
    }
    return this;
  }
  /** Get the parser's current logger. */
  getLogger() {
    return this.logCallback;
  }
};
var PREDICATE_STEP_TYPE_CAPTURE = 1;
var PREDICATE_STEP_TYPE_STRING = 2;
var QUERY_WORD_REGEX = /[\w-]+/g;
var CaptureQuantifier = {
  Zero: 0,
  ZeroOrOne: 1,
  ZeroOrMore: 2,
  One: 3,
  OneOrMore: 4
};
var isCaptureStep = /* @__PURE__ */ __name((step) => step.type === "capture", "isCaptureStep");
var isStringStep = /* @__PURE__ */ __name((step) => step.type === "string", "isStringStep");
var QueryErrorKind = {
  Syntax: 1,
  NodeName: 2,
  FieldName: 3,
  CaptureName: 4,
  PatternStructure: 5
};
var QueryError = class _QueryError extends Error {
  constructor(kind, info2, index, length) {
    super(_QueryError.formatMessage(kind, info2));
    this.kind = kind;
    this.info = info2;
    this.index = index;
    this.length = length;
    this.name = "QueryError";
  }
  kind;
  info;
  index;
  length;
  static {
    __name(this, "QueryError");
  }
  /** Formats an error message based on the error kind and info */
  static formatMessage(kind, info2) {
    switch (kind) {
      case QueryErrorKind.NodeName:
        return `Bad node name '${info2.word}'`;
      case QueryErrorKind.FieldName:
        return `Bad field name '${info2.word}'`;
      case QueryErrorKind.CaptureName:
        return `Bad capture name @${info2.word}`;
      case QueryErrorKind.PatternStructure:
        return `Bad pattern structure at offset ${info2.suffix}`;
      case QueryErrorKind.Syntax:
        return `Bad syntax at offset ${info2.suffix}`;
    }
  }
};
function parseAnyPredicate(steps, index, operator, textPredicates) {
  if (steps.length !== 3) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}`
    );
  }
  if (!isCaptureStep(steps[1])) {
    throw new Error(
      `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}"`
    );
  }
  const isPositive = operator === "eq?" || operator === "any-eq?";
  const matchAll = !operator.startsWith("any-");
  if (isCaptureStep(steps[2])) {
    const captureName1 = steps[1].name;
    const captureName2 = steps[2].name;
    textPredicates[index].push((captures) => {
      const nodes1 = [];
      const nodes2 = [];
      for (const c of captures) {
        if (c.name === captureName1) nodes1.push(c.node);
        if (c.name === captureName2) nodes2.push(c.node);
      }
      const compare = /* @__PURE__ */ __name((n1, n2, positive) => {
        return positive ? n1.text === n2.text : n1.text !== n2.text;
      }, "compare");
      return matchAll ? nodes1.every((n1) => nodes2.some((n2) => compare(n1, n2, isPositive))) : nodes1.some((n1) => nodes2.some((n2) => compare(n1, n2, isPositive)));
    });
  } else {
    const captureName = steps[1].name;
    const stringValue = steps[2].value;
    const matches = /* @__PURE__ */ __name((n) => n.text === stringValue, "matches");
    const doesNotMatch = /* @__PURE__ */ __name((n) => n.text !== stringValue, "doesNotMatch");
    textPredicates[index].push((captures) => {
      const nodes = [];
      for (const c of captures) {
        if (c.name === captureName) nodes.push(c.node);
      }
      const test = isPositive ? matches : doesNotMatch;
      return matchAll ? nodes.every(test) : nodes.some(test);
    });
  }
}
__name(parseAnyPredicate, "parseAnyPredicate");
function parseMatchPredicate(steps, index, operator, textPredicates) {
  if (steps.length !== 3) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}.`
    );
  }
  if (steps[1].type !== "capture") {
    throw new Error(
      `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
    );
  }
  if (steps[2].type !== "string") {
    throw new Error(
      `Second argument of \`#${operator}\` predicate must be a string. Got @${steps[2].name}.`
    );
  }
  const isPositive = operator === "match?" || operator === "any-match?";
  const matchAll = !operator.startsWith("any-");
  const captureName = steps[1].name;
  const regex = new RegExp(steps[2].value);
  textPredicates[index].push((captures) => {
    const nodes = [];
    for (const c of captures) {
      if (c.name === captureName) nodes.push(c.node.text);
    }
    const test = /* @__PURE__ */ __name((text, positive) => {
      return positive ? regex.test(text) : !regex.test(text);
    }, "test");
    if (nodes.length === 0) return !isPositive;
    return matchAll ? nodes.every((text) => test(text, isPositive)) : nodes.some((text) => test(text, isPositive));
  });
}
__name(parseMatchPredicate, "parseMatchPredicate");
function parseAnyOfPredicate(steps, index, operator, textPredicates) {
  if (steps.length < 2) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected at least 1. Got ${steps.length - 1}.`
    );
  }
  if (steps[1].type !== "capture") {
    throw new Error(
      `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
    );
  }
  const isPositive = operator === "any-of?";
  const captureName = steps[1].name;
  const stringSteps = steps.slice(2);
  if (!stringSteps.every(isStringStep)) {
    throw new Error(
      `Arguments to \`#${operator}\` predicate must be strings.".`
    );
  }
  const values = stringSteps.map((s) => s.value);
  textPredicates[index].push((captures) => {
    const nodes = [];
    for (const c of captures) {
      if (c.name === captureName) nodes.push(c.node.text);
    }
    if (nodes.length === 0) return !isPositive;
    return nodes.every((text) => values.includes(text)) === isPositive;
  });
}
__name(parseAnyOfPredicate, "parseAnyOfPredicate");
function parseIsPredicate(steps, index, operator, assertedProperties, refutedProperties) {
  if (steps.length < 2 || steps.length > 3) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`
    );
  }
  if (!steps.every(isStringStep)) {
    throw new Error(
      `Arguments to \`#${operator}\` predicate must be strings.".`
    );
  }
  const properties = operator === "is?" ? assertedProperties : refutedProperties;
  if (!properties[index]) properties[index] = {};
  properties[index][steps[1].value] = steps[2]?.value ?? null;
}
__name(parseIsPredicate, "parseIsPredicate");
function parseSetDirective(steps, index, setProperties) {
  if (steps.length < 2 || steps.length > 3) {
    throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
  }
  if (!steps.every(isStringStep)) {
    throw new Error(`Arguments to \`#set!\` predicate must be strings.".`);
  }
  if (!setProperties[index]) setProperties[index] = {};
  setProperties[index][steps[1].value] = steps[2]?.value ?? null;
}
__name(parseSetDirective, "parseSetDirective");
function parsePattern(index, stepType, stepValueId, captureNames, stringValues, steps, textPredicates, predicates, setProperties, assertedProperties, refutedProperties) {
  if (stepType === PREDICATE_STEP_TYPE_CAPTURE) {
    const name2 = captureNames[stepValueId];
    steps.push({ type: "capture", name: name2 });
  } else if (stepType === PREDICATE_STEP_TYPE_STRING) {
    steps.push({ type: "string", value: stringValues[stepValueId] });
  } else if (steps.length > 0) {
    if (steps[0].type !== "string") {
      throw new Error("Predicates must begin with a literal value");
    }
    const operator = steps[0].value;
    switch (operator) {
      case "any-not-eq?":
      case "not-eq?":
      case "any-eq?":
      case "eq?":
        parseAnyPredicate(steps, index, operator, textPredicates);
        break;
      case "any-not-match?":
      case "not-match?":
      case "any-match?":
      case "match?":
        parseMatchPredicate(steps, index, operator, textPredicates);
        break;
      case "not-any-of?":
      case "any-of?":
        parseAnyOfPredicate(steps, index, operator, textPredicates);
        break;
      case "is?":
      case "is-not?":
        parseIsPredicate(steps, index, operator, assertedProperties, refutedProperties);
        break;
      case "set!":
        parseSetDirective(steps, index, setProperties);
        break;
      default:
        predicates[index].push({ operator, operands: steps.slice(1) });
    }
    steps.length = 0;
  }
}
__name(parsePattern, "parsePattern");
var finalizer5 = newFinalizer((address) => {
  C._ts_query_delete(address);
});
var Query = class {
  static {
    __name(this, "Query");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  exceededMatchLimit;
  /** @internal */
  textPredicates;
  /** The names of the captures used in the query. */
  captureNames;
  /** The quantifiers of the captures used in the query. */
  captureQuantifiers;
  /**
   * The other user-defined predicates associated with the given index.
   *
   * This includes predicates with operators other than:
   * - `match?`
   * - `eq?` and `not-eq?`
   * - `any-of?` and `not-any-of?`
   * - `is?` and `is-not?`
   * - `set!`
   */
  predicates;
  /** The properties for predicates with the operator `set!`. */
  setProperties;
  /** The properties for predicates with the operator `is?`. */
  assertedProperties;
  /** The properties for predicates with the operator `is-not?`. */
  refutedProperties;
  /** The maximum number of in-progress matches for this cursor. */
  matchLimit;
  /**
   * Create a new query from a string containing one or more S-expression
   * patterns.
   *
   * The query is associated with a particular language, and can only be run
   * on syntax nodes parsed with that language. References to Queries can be
   * shared between multiple threads.
   *
   * @link {@see https://tree-sitter.github.io/tree-sitter/using-parsers/queries}
   */
  constructor(language, source) {
    const sourceLength = C.lengthBytesUTF8(source);
    const sourceAddress = C._malloc(sourceLength + 1);
    C.stringToUTF8(source, sourceAddress, sourceLength + 1);
    const address = C._ts_query_new(
      language[0],
      sourceAddress,
      sourceLength,
      TRANSFER_BUFFER,
      TRANSFER_BUFFER + SIZE_OF_INT
    );
    if (!address) {
      const errorId = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const errorByte = C.getValue(TRANSFER_BUFFER, "i32");
      const errorIndex = C.UTF8ToString(sourceAddress, errorByte).length;
      const suffix = source.slice(errorIndex, errorIndex + 100).split("\n")[0];
      const word = suffix.match(QUERY_WORD_REGEX)?.[0] ?? "";
      C._free(sourceAddress);
      switch (errorId) {
        case QueryErrorKind.Syntax:
          throw new QueryError(QueryErrorKind.Syntax, { suffix: `${errorIndex}: '${suffix}'...` }, errorIndex, 0);
        case QueryErrorKind.NodeName:
          throw new QueryError(errorId, { word }, errorIndex, word.length);
        case QueryErrorKind.FieldName:
          throw new QueryError(errorId, { word }, errorIndex, word.length);
        case QueryErrorKind.CaptureName:
          throw new QueryError(errorId, { word }, errorIndex, word.length);
        case QueryErrorKind.PatternStructure:
          throw new QueryError(errorId, { suffix: `${errorIndex}: '${suffix}'...` }, errorIndex, 0);
      }
    }
    const stringCount = C._ts_query_string_count(address);
    const captureCount = C._ts_query_capture_count(address);
    const patternCount = C._ts_query_pattern_count(address);
    const captureNames = new Array(captureCount);
    const captureQuantifiers = new Array(patternCount);
    const stringValues = new Array(stringCount);
    for (let i2 = 0; i2 < captureCount; i2++) {
      const nameAddress = C._ts_query_capture_name_for_id(
        address,
        i2,
        TRANSFER_BUFFER
      );
      const nameLength = C.getValue(TRANSFER_BUFFER, "i32");
      captureNames[i2] = C.UTF8ToString(nameAddress, nameLength);
    }
    for (let i2 = 0; i2 < patternCount; i2++) {
      const captureQuantifiersArray = new Array(captureCount);
      for (let j = 0; j < captureCount; j++) {
        const quantifier = C._ts_query_capture_quantifier_for_id(address, i2, j);
        captureQuantifiersArray[j] = quantifier;
      }
      captureQuantifiers[i2] = captureQuantifiersArray;
    }
    for (let i2 = 0; i2 < stringCount; i2++) {
      const valueAddress = C._ts_query_string_value_for_id(
        address,
        i2,
        TRANSFER_BUFFER
      );
      const nameLength = C.getValue(TRANSFER_BUFFER, "i32");
      stringValues[i2] = C.UTF8ToString(valueAddress, nameLength);
    }
    const setProperties = new Array(patternCount);
    const assertedProperties = new Array(patternCount);
    const refutedProperties = new Array(patternCount);
    const predicates = new Array(patternCount);
    const textPredicates = new Array(patternCount);
    for (let i2 = 0; i2 < patternCount; i2++) {
      const predicatesAddress = C._ts_query_predicates_for_pattern(address, i2, TRANSFER_BUFFER);
      const stepCount = C.getValue(TRANSFER_BUFFER, "i32");
      predicates[i2] = [];
      textPredicates[i2] = [];
      const steps = new Array();
      let stepAddress = predicatesAddress;
      for (let j = 0; j < stepCount; j++) {
        const stepType = C.getValue(stepAddress, "i32");
        stepAddress += SIZE_OF_INT;
        const stepValueId = C.getValue(stepAddress, "i32");
        stepAddress += SIZE_OF_INT;
        parsePattern(
          i2,
          stepType,
          stepValueId,
          captureNames,
          stringValues,
          steps,
          textPredicates,
          predicates,
          setProperties,
          assertedProperties,
          refutedProperties
        );
      }
      Object.freeze(textPredicates[i2]);
      Object.freeze(predicates[i2]);
      Object.freeze(setProperties[i2]);
      Object.freeze(assertedProperties[i2]);
      Object.freeze(refutedProperties[i2]);
    }
    C._free(sourceAddress);
    this[0] = address;
    this.captureNames = captureNames;
    this.captureQuantifiers = captureQuantifiers;
    this.textPredicates = textPredicates;
    this.predicates = predicates;
    this.setProperties = setProperties;
    this.assertedProperties = assertedProperties;
    this.refutedProperties = refutedProperties;
    this.exceededMatchLimit = false;
    finalizer5?.register(this, address, this);
  }
  /** Delete the query, freeing its resources. */
  delete() {
    finalizer5?.unregister(this);
    C._ts_query_delete(this[0]);
    this[0] = 0;
  }
  /**
   * Iterate over all of the matches in the order that they were found.
   *
   * Each match contains the index of the pattern that matched, and a list of
   * captures. Because multiple patterns can match the same set of nodes,
   * one match may contain captures that appear *before* some of the
   * captures from a previous match.
   *
   * @param {Node} node - The node to execute the query on.
   *
   * @param {QueryOptions} options - Options for query execution.
   */
  matches(node, options = {}) {
    const startPosition = options.startPosition ?? ZERO_POINT;
    const endPosition = options.endPosition ?? ZERO_POINT;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? 0;
    const startContainingPosition = options.startContainingPosition ?? ZERO_POINT;
    const endContainingPosition = options.endContainingPosition ?? ZERO_POINT;
    const startContainingIndex = options.startContainingIndex ?? 0;
    const endContainingIndex = options.endContainingIndex ?? 0;
    const matchLimit = options.matchLimit ?? 4294967295;
    const maxStartDepth = options.maxStartDepth ?? 4294967295;
    const progressCallback = options.progressCallback;
    if (typeof matchLimit !== "number") {
      throw new Error("Arguments must be numbers");
    }
    this.matchLimit = matchLimit;
    if (endIndex !== 0 && startIndex > endIndex) {
      throw new Error("`startIndex` cannot be greater than `endIndex`");
    }
    if (endPosition !== ZERO_POINT && (startPosition.row > endPosition.row || startPosition.row === endPosition.row && startPosition.column > endPosition.column)) {
      throw new Error("`startPosition` cannot be greater than `endPosition`");
    }
    if (endContainingIndex !== 0 && startContainingIndex > endContainingIndex) {
      throw new Error("`startContainingIndex` cannot be greater than `endContainingIndex`");
    }
    if (endContainingPosition !== ZERO_POINT && (startContainingPosition.row > endContainingPosition.row || startContainingPosition.row === endContainingPosition.row && startContainingPosition.column > endContainingPosition.column)) {
      throw new Error("`startContainingPosition` cannot be greater than `endContainingPosition`");
    }
    if (progressCallback) {
      C.currentQueryProgressCallback = progressCallback;
    }
    marshalNode(node);
    C._ts_query_matches_wasm(
      this[0],
      node.tree[0],
      startPosition.row,
      startPosition.column,
      endPosition.row,
      endPosition.column,
      startIndex,
      endIndex,
      startContainingPosition.row,
      startContainingPosition.column,
      endContainingPosition.row,
      endContainingPosition.column,
      startContainingIndex,
      endContainingIndex,
      matchLimit,
      maxStartDepth
    );
    const rawCount = C.getValue(TRANSFER_BUFFER, "i32");
    const startAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const didExceedMatchLimit = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
    const result = new Array(rawCount);
    this.exceededMatchLimit = Boolean(didExceedMatchLimit);
    let filteredCount = 0;
    let address = startAddress;
    for (let i2 = 0; i2 < rawCount; i2++) {
      const patternIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captureCount = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captures = new Array(captureCount);
      address = unmarshalCaptures(this, node.tree, address, patternIndex, captures);
      if (this.textPredicates[patternIndex].every((p) => p(captures))) {
        result[filteredCount] = { patternIndex, captures };
        const setProperties = this.setProperties[patternIndex];
        result[filteredCount].setProperties = setProperties;
        const assertedProperties = this.assertedProperties[patternIndex];
        result[filteredCount].assertedProperties = assertedProperties;
        const refutedProperties = this.refutedProperties[patternIndex];
        result[filteredCount].refutedProperties = refutedProperties;
        filteredCount++;
      }
    }
    result.length = filteredCount;
    C._free(startAddress);
    C.currentQueryProgressCallback = null;
    return result;
  }
  /**
   * Iterate over all of the individual captures in the order that they
   * appear.
   *
   * This is useful if you don't care about which pattern matched, and just
   * want a single, ordered sequence of captures.
   *
   * @param {Node} node - The node to execute the query on.
   *
   * @param {QueryOptions} options - Options for query execution.
   */
  captures(node, options = {}) {
    const startPosition = options.startPosition ?? ZERO_POINT;
    const endPosition = options.endPosition ?? ZERO_POINT;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? 0;
    const startContainingPosition = options.startContainingPosition ?? ZERO_POINT;
    const endContainingPosition = options.endContainingPosition ?? ZERO_POINT;
    const startContainingIndex = options.startContainingIndex ?? 0;
    const endContainingIndex = options.endContainingIndex ?? 0;
    const matchLimit = options.matchLimit ?? 4294967295;
    const maxStartDepth = options.maxStartDepth ?? 4294967295;
    const progressCallback = options.progressCallback;
    if (typeof matchLimit !== "number") {
      throw new Error("Arguments must be numbers");
    }
    this.matchLimit = matchLimit;
    if (endIndex !== 0 && startIndex > endIndex) {
      throw new Error("`startIndex` cannot be greater than `endIndex`");
    }
    if (endPosition !== ZERO_POINT && (startPosition.row > endPosition.row || startPosition.row === endPosition.row && startPosition.column > endPosition.column)) {
      throw new Error("`startPosition` cannot be greater than `endPosition`");
    }
    if (endContainingIndex !== 0 && startContainingIndex > endContainingIndex) {
      throw new Error("`startContainingIndex` cannot be greater than `endContainingIndex`");
    }
    if (endContainingPosition !== ZERO_POINT && (startContainingPosition.row > endContainingPosition.row || startContainingPosition.row === endContainingPosition.row && startContainingPosition.column > endContainingPosition.column)) {
      throw new Error("`startContainingPosition` cannot be greater than `endContainingPosition`");
    }
    if (progressCallback) {
      C.currentQueryProgressCallback = progressCallback;
    }
    marshalNode(node);
    C._ts_query_captures_wasm(
      this[0],
      node.tree[0],
      startPosition.row,
      startPosition.column,
      endPosition.row,
      endPosition.column,
      startIndex,
      endIndex,
      startContainingPosition.row,
      startContainingPosition.column,
      endContainingPosition.row,
      endContainingPosition.column,
      startContainingIndex,
      endContainingIndex,
      matchLimit,
      maxStartDepth
    );
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const startAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const didExceedMatchLimit = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
    const result = new Array();
    this.exceededMatchLimit = Boolean(didExceedMatchLimit);
    const captures = new Array();
    let address = startAddress;
    for (let i2 = 0; i2 < count; i2++) {
      const patternIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captureCount = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captureIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      captures.length = captureCount;
      address = unmarshalCaptures(this, node.tree, address, patternIndex, captures);
      if (this.textPredicates[patternIndex].every((p) => p(captures))) {
        const capture = captures[captureIndex];
        const setProperties = this.setProperties[patternIndex];
        capture.setProperties = setProperties;
        const assertedProperties = this.assertedProperties[patternIndex];
        capture.assertedProperties = assertedProperties;
        const refutedProperties = this.refutedProperties[patternIndex];
        capture.refutedProperties = refutedProperties;
        result.push(capture);
      }
    }
    C._free(startAddress);
    C.currentQueryProgressCallback = null;
    return result;
  }
  /** Get the predicates for a given pattern. */
  predicatesForPattern(patternIndex) {
    return this.predicates[patternIndex];
  }
  /**
   * Disable a certain capture within a query.
   *
   * This prevents the capture from being returned in matches, and also
   * avoids any resource usage associated with recording the capture.
   */
  disableCapture(captureName) {
    const captureNameLength = C.lengthBytesUTF8(captureName);
    const captureNameAddress = C._malloc(captureNameLength + 1);
    C.stringToUTF8(captureName, captureNameAddress, captureNameLength + 1);
    C._ts_query_disable_capture(this[0], captureNameAddress, captureNameLength);
    C._free(captureNameAddress);
  }
  /**
   * Disable a certain pattern within a query.
   *
   * This prevents the pattern from matching, and also avoids any resource
   * usage associated with the pattern. This throws an error if the pattern
   * index is out of bounds.
   */
  disablePattern(patternIndex) {
    if (patternIndex >= this.predicates.length) {
      throw new Error(
        `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
      );
    }
    C._ts_query_disable_pattern(this[0], patternIndex);
  }
  /**
   * Check if, on its last execution, this cursor exceeded its maximum number
   * of in-progress matches.
   */
  didExceedMatchLimit() {
    return this.exceededMatchLimit;
  }
  /** Get the byte offset where the given pattern starts in the query's source. */
  startIndexForPattern(patternIndex) {
    if (patternIndex >= this.predicates.length) {
      throw new Error(
        `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
      );
    }
    return C._ts_query_start_byte_for_pattern(this[0], patternIndex);
  }
  /** Get the byte offset where the given pattern ends in the query's source. */
  endIndexForPattern(patternIndex) {
    if (patternIndex >= this.predicates.length) {
      throw new Error(
        `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
      );
    }
    return C._ts_query_end_byte_for_pattern(this[0], patternIndex);
  }
  /** Get the number of patterns in the query. */
  patternCount() {
    return C._ts_query_pattern_count(this[0]);
  }
  /** Get the index for a given capture name. */
  captureIndexForName(captureName) {
    return this.captureNames.indexOf(captureName);
  }
  /** Check if a given pattern within a query has a single root node. */
  isPatternRooted(patternIndex) {
    return C._ts_query_is_pattern_rooted(this[0], patternIndex) === 1;
  }
  /** Check if a given pattern within a query has a single root node. */
  isPatternNonLocal(patternIndex) {
    return C._ts_query_is_pattern_non_local(this[0], patternIndex) === 1;
  }
  /**
   * Check if a given step in a query is 'definite'.
   *
   * A query step is 'definite' if its parent pattern will be guaranteed to
   * match successfully once it reaches the step.
   */
  isPatternGuaranteedAtStep(byteIndex) {
    return C._ts_query_is_pattern_guaranteed_at_step(this[0], byteIndex) === 1;
  }
};

// src/files.ts
var MAX_FILE_BYTES = 512 * 1024;
var MAX_FILES = 3e3;
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  ".git",
  ".hg",
  ".svn",
  ".next",
  ".nuxt",
  "out",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  ".tox",
  "bower_components",
  "third_party",
  ".gradle",
  ".idea",
  "target"
]);
var LOCKFILES = /* @__PURE__ */ new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock", "go.sum", "Cargo.lock", "composer.lock"]);
var TREE_EXT = {
  py: "python",
  pyw: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "tsx",
  java: "java",
  go: "go"
};
var REGEX_EXT = {
  kt: "kotlin",
  kts: "kotlin",
  scala: "scala",
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  rs: "rust",
  php: "php",
  rb: "ruby",
  swift: "swift"
};
var KEY_EXT = /* @__PURE__ */ new Set(["pem", "crt", "cer", "key", "pub", "csr"]);
var KEY_NAMES = /^(id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|authorized_keys2?|known_hosts|ssh_host_\w+_key(\.pub)?)$/;
var MANIFESTS = /* @__PURE__ */ new Set(["package.json", "pyproject.toml", "pom.xml", "build.gradle", "build.gradle.kts", "go.mod", "Pipfile", "setup.py", "setup.cfg"]);
var CONFIG_NAME = /^(nginx\.conf|httpd\.conf|apache2?\.conf|ssl\.conf|haproxy\.cfg|openssl\.cnf|Dockerfile(\..+)?|Containerfile|.*\.dockerfile|\.htaccess|docker-compose.*\.ya?ml|Caddyfile|envoy\.ya?ml|traefik\.(ya?ml|toml)|sshd?_config)$/i;
var CONFIG_EXT = /* @__PURE__ */ new Set(["conf", "cnf", "cfg", "tf", "tfvars", "yaml", "yml", "hcl", "ini", "properties", "toml", "env", "xml", "json"]);
var basename = (p) => p.slice(p.lastIndexOf("/") + 1);
var ext = (p) => {
  const b = basename(p);
  const i2 = b.lastIndexOf(".");
  return i2 > 0 ? b.slice(i2 + 1).toLowerCase() : "";
};
function normalizePath(p) {
  return p.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}
function pathSkipReason(path) {
  const parts2 = normalizePath(path).split("/");
  if (parts2.slice(0, -1).some((d) => SKIP_DIRS.has(d))) return "excluded-dir";
  const b = parts2[parts2.length - 1] ?? "";
  if (/[.-]min\.(js|css|mjs)$/i.test(b) || /\.bundle\.js$/i.test(b) || /\.map$/i.test(b)) return "minified";
  if (LOCKFILES.has(b)) return "irrelevant";
  return null;
}
function classify(path) {
  const p = normalizePath(path);
  const b = basename(p);
  const e = ext(p);
  if (MANIFESTS.has(b) || /^requirements.*\.txt$/i.test(b)) return { kind: "manifest", name: b };
  if (KEY_EXT.has(e) || KEY_NAMES.test(b)) return { kind: "key" };
  const tl = TREE_EXT[e];
  if (tl) return { kind: "tree", language: tl };
  const rl = REGEX_EXT[e];
  if (rl) return { kind: "regex-source", language: rl };
  if (CONFIG_NAME.test(b) || CONFIG_EXT.has(e)) return { kind: "config" };
  return null;
}
function contentSkipReason(path, content2, bytes = content2.length) {
  if (bytes > MAX_FILE_BYTES) return "too-large";
  if (content2.includes("\0")) return "binary";
  const c = classify(path);
  if (c && (c.kind === "tree" || c.kind === "regex-source") && content2.length > 5e3) {
    const lines = content2.split("\n").length;
    if (content2.length / lines > 400) return "minified";
  }
  return null;
}
function globToRegExp(glob) {
  let re2 = "";
  for (let i2 = 0; i2 < glob.length; i2++) {
    const ch = glob[i2];
    if (ch === "*") {
      if (glob[i2 + 1] === "*") {
        re2 += ".*";
        i2++;
        if (glob[i2 + 1] === "/") i2++;
      } else re2 += "[^/]*";
    } else if (ch === "?") re2 += "[^/]";
    else re2 += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re2}$`, "i");
}
function matchesGlobs(path, globs, raw) {
  const p = normalizePath(path);
  const b = basename(p);
  return globs.some((g, i2) => g.test(raw[i2].includes("/") ? p : b));
}
function commentPrefixes(path) {
  const e = ext(path);
  const b = basename(path);
  if (["kt", "kts", "scala", "c", "h", "cc", "cpp", "cxx", "hpp", "cs", "rs", "swift", "go", "java", "js", "ts"].includes(e))
    return ["//", "/*", "*"];
  if (e === "php") return ["//", "#", "/*", "*"];
  if (e === "ini" || e === "cnf") return ["#", ";"];
  if (e === "xml") return ["<!--"];
  if (/^Dockerfile/i.test(b) || ["conf", "cfg", "tf", "tfvars", "hcl", "yaml", "yml", "toml", "env", "properties", "rb", "py", "txt"].includes(e))
    return ["#", "//"];
  return ["#", "//"];
}

// src/matchers/treesitter.ts
var CALL_QUERIES = {
  python: "(call function: (_) @callee arguments: (_) @args) @call",
  javascript: "(call_expression function: (_) @callee arguments: (_) @args) @call (new_expression constructor: (_) @callee) @call",
  typescript: "(call_expression function: (_) @callee arguments: (_) @args) @call (new_expression constructor: (_) @callee) @call",
  tsx: "(call_expression function: (_) @callee arguments: (_) @args) @call (new_expression constructor: (_) @callee) @call",
  java: "(method_invocation) @call (object_creation_expression type: (_) @callee) @call",
  go: "(call_expression function: (_) @callee arguments: (_) @args) @call"
};
var queryCache = /* @__PURE__ */ new Map();
function getQuery(lang, langName, source) {
  const key = `${langName}\0${source}`;
  let q = queryCache.get(key);
  if (!q) {
    q = new Query(lang, source);
    queryCache.set(key, q);
  }
  return q;
}
function literalValue(n) {
  const t = n.text;
  switch (n.type) {
    case "string": {
      if (n.children.some((c) => c?.type === "interpolation")) return void 0;
      const m = /^[rRbBuUfF]{0,2}('''|"""|'|")([\s\S]*)\1$/.exec(t);
      return m ? m[2] : void 0;
    }
    case "template_string":
      return n.children.some((c) => c?.type === "template_substitution") ? void 0 : t.slice(1, -1);
    case "string_literal":
    // Java
    case "interpreted_string_literal":
    // Go
    case "raw_string_literal":
      return t.startsWith('"""') ? t.slice(3, -3) : t.slice(1, -1);
    case "concatenated_string": {
      const parts2 = n.namedChildren.map((c) => c ? literalValue(c) : void 0);
      return parts2.every((p) => p !== void 0) ? parts2.join("") : void 0;
    }
    case "number":
    case "integer":
    case "decimal_integer_literal":
    case "int_literal":
      return t.replace(/[_lL]/g, "");
    default:
      return void 0;
  }
}
function argValue(n) {
  const lit = literalValue(n);
  return lit !== void 0 ? { value: lit, literal: true } : { value: n.text, literal: false };
}
function collectProps(args2, out3) {
  if (!args2) return;
  for (const a of args2.namedChildren) {
    if (!a || a.type !== "object" && a.type !== "dictionary") continue;
    for (const pair of a.namedChildren) {
      if (!pair || pair.type !== "pair") continue;
      const k = pair.childForFieldName("key");
      const v = pair.childForFieldName("value");
      if (!k || !v) continue;
      const key = literalValue(k) ?? k.text;
      if (v.type === "array" || v.type === "list") {
        const first = v.namedChildren.find((c) => c && literalValue(c) !== void 0);
        if (first) out3[key] = literalValue(first);
      } else {
        out3[key] = literalValue(v) ?? v.text;
      }
    }
  }
}
function extractCalls(tree, lang, langName) {
  const q = getQuery(lang, langName, CALL_QUERIES[langName]);
  const out3 = [];
  for (const m of q.matches(tree.rootNode)) {
    const call = m.captures.find((c) => c.name === "call")?.node;
    if (!call) continue;
    let calleeNode = m.captures.find((c) => c.name === "callee")?.node ?? null;
    let argsNode = m.captures.find((c) => c.name === "args")?.node ?? null;
    let callee;
    if (langName === "java" && call.type === "method_invocation") {
      const obj = call.childForFieldName("object");
      const name2 = call.childForFieldName("name");
      callee = `${obj ? obj.text + "." : ""}${name2?.text ?? ""}`;
      argsNode = call.childForFieldName("arguments");
      calleeNode = name2;
    } else if (call.type === "new_expression" || call.type === "object_creation_expression") {
      callee = `new ${calleeNode?.text ?? ""}`;
      argsNode = call.childForFieldName("arguments");
    } else {
      callee = calleeNode?.text ?? "";
    }
    callee = callee.replace(/\s+/g, "").replace(/\?\./g, ".").replace(/^new/, "new ");
    const args2 = [];
    const kwargs = {};
    const props = {};
    if (argsNode) {
      for (const a of argsNode.namedChildren) {
        if (!a || a.type === "comment") continue;
        if (a.type === "keyword_argument") {
          const k = a.childForFieldName("name");
          const v = a.childForFieldName("value");
          if (k && v) {
            if (v.type === "list" || v.type === "tuple") {
              const first = v.namedChildren.find((c) => c && literalValue(c) !== void 0);
              kwargs[k.text] = first ? literalValue(first) : v.text;
            } else kwargs[k.text] = argValue(v).value;
          }
          continue;
        }
        if (a.type === "list_splat" || a.type === "dictionary_splat" || a.type === "spread_element") continue;
        args2.push(argValue(a));
      }
      collectProps(argsNode, props);
    }
    out3.push({ node: call, callee, args: args2, kwargs, props, text: call.text });
  }
  return out3;
}
var reCache = /* @__PURE__ */ new Map();
function re(src, flags2 = "i") {
  const k = `${flags2}|${src}`;
  let r = reCache.get(k);
  if (!r) {
    r = new RegExp(src, flags2);
    reCache.set(k, r);
  }
  return r;
}
function fromCall(site, spec) {
  if (!spec) return void 0;
  if (spec.includes("|") && !spec.startsWith("regex:")) {
    for (const alt of spec.split("|")) {
      const v = fromCall(site, alt);
      if (v !== void 0) return v;
    }
    return void 0;
  }
  if (spec === "callee") return site.callee;
  if (spec === "match") return site.text;
  const arg = /^arg(\d+)$/.exec(spec);
  if (arg) return site.args[Number(arg[1])]?.value;
  if (spec.startsWith("kwarg:")) return site.kwargs[spec.slice(6)];
  if (spec.startsWith("prop:")) return site.props[spec.slice(5)];
  if (spec.startsWith("regex:")) return re(spec.slice(6)).exec(site.text)?.[1];
  return void 0;
}
function callMatches(rule, site) {
  if (rule.callee && !re(rule.callee, "").test(site.callee)) return false;
  for (const [i2, cond] of Object.entries(rule.args ?? {})) {
    const a = site.args[Number(i2)];
    if (!a || !re(cond).test(a.value)) return false;
  }
  for (const [k, cond] of Object.entries(rule.kwargs ?? {})) {
    const v = site.kwargs[k];
    if (v === void 0 || !re(cond).test(v)) return false;
  }
  for (const [k, cond] of Object.entries(rule.props ?? {})) {
    const v = site.props[k];
    if (v === void 0 || !re(cond).test(v)) return false;
  }
  return true;
}
function queryHits(rule, tree, lang, langName) {
  const q = getQuery(lang, langName, rule.query);
  const hits = [];
  for (const m of q.matches(tree.rootNode)) {
    const node = (m.captures.find((c) => c.name === "match") ?? m.captures[0])?.node;
    if (!node) continue;
    const cap = (spec) => {
      if (!spec) return void 0;
      if (spec.startsWith("capture:")) {
        const n = m.captures.find((c) => c.name === spec.slice(8))?.node;
        return n ? literalValue(n) ?? n.text : void 0;
      }
      if (spec.startsWith("regex:")) return re(spec.slice(6)).exec(node.text)?.[1];
      if (spec === "match") return node.text;
      return void 0;
    };
    hits.push({ node, value: cap(rule.variant_from), keySizeText: cap(rule.key_size), text: node.text });
  }
  return hits;
}

// src/der.ts
function readNode(b, pos) {
  const tag = b[pos];
  let len = b[pos + 1];
  let hdr = 2;
  if (len & 128) {
    const n = len & 127;
    if (n === 0 || n > 4) throw new Error("unsupported DER length");
    len = 0;
    for (let i2 = 0; i2 < n; i2++) len = len * 256 + b[pos + 2 + i2];
    hdr += n;
  }
  if (pos + hdr + len > b.length) throw new Error("truncated DER");
  return { tag, start: pos, hdr, len, bytes: b };
}
var content = (n) => n.bytes.subarray(n.start + n.hdr, n.start + n.hdr + n.len);
function children(n) {
  const out3 = [];
  const c = content(n);
  let p = 0;
  while (p < c.length) {
    const child = readNode(c, p);
    out3.push(child);
    p += child.hdr + child.len;
  }
  return out3;
}
var parse = (b) => readNode(b, 0);
function oid(n) {
  const c = content(n);
  const parts2 = [Math.floor(c[0] / 40), c[0] % 40];
  let v = 0;
  for (let i2 = 1; i2 < c.length; i2++) {
    v = v * 128 + (c[i2] & 127);
    if (!(c[i2] & 128)) {
      parts2.push(v);
      v = 0;
    }
  }
  return parts2.join(".");
}
function intBits(n) {
  const c = content(n);
  let i2 = 0;
  while (i2 < c.length - 1 && c[i2] === 0) i2++;
  const first = c[i2];
  return (c.length - i2 - 1) * 8 + (first ? 32 - Math.clz32(first) : 0);
}
var OIDS = {
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.113549.1.1.10": "RSA-PSS",
  "1.2.840.10045.2.1": "EC",
  "1.2.840.10040.4.1": "DSA",
  "1.2.840.113549.1.3.1": "DH",
  "1.3.101.110": "X25519",
  "1.3.101.111": "X448",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
  // ML-KEM / ML-DSA / SLH-DSA (NIST CSOR)
  "2.16.840.1.101.3.4.4.1": "ML-KEM-512",
  "2.16.840.1.101.3.4.4.2": "ML-KEM-768",
  "2.16.840.1.101.3.4.4.3": "ML-KEM-1024",
  "2.16.840.1.101.3.4.3.17": "ML-DSA-44",
  "2.16.840.1.101.3.4.3.18": "ML-DSA-65",
  "2.16.840.1.101.3.4.3.19": "ML-DSA-87"
};
var CURVES = {
  "1.2.840.10045.3.1.7": { name: "P-256", bits: 256 },
  "1.3.132.0.34": { name: "P-384", bits: 384 },
  "1.3.132.0.35": { name: "P-521", bits: 521 },
  "1.3.132.0.10": { name: "secp256k1", bits: 256 },
  "1.2.840.10045.3.1.1": { name: "P-192", bits: 192 },
  "1.3.132.0.33": { name: "P-224", bits: 224 }
};
var SIG_OIDS = {
  "1.2.840.113549.1.1.4": "md5WithRSAEncryption",
  "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
  "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.10045.4.1": "ecdsa-with-SHA1",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
  "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.2.840.10040.4.3": "dsa-with-SHA1",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
  "2.16.840.1.101.3.4.3.17": "ML-DSA-44",
  "2.16.840.1.101.3.4.3.18": "ML-DSA-65",
  "2.16.840.1.101.3.4.3.19": "ML-DSA-87"
};
function spkiInfo(spki) {
  const [algId, bitStr] = children(spki);
  const [algOid, params] = children(algId);
  const algorithm = OIDS[oid(algOid)] ?? `OID ${oid(algOid)}`;
  if (algorithm === "RSA" || algorithm === "RSA-PSS") {
    const inner = parse(content(bitStr).subarray(1));
    return { algorithm, bits: intBits(children(inner)[0]) };
  }
  if (algorithm === "EC" && params && params.tag === 6) {
    const c = CURVES[oid(params)];
    return { algorithm: "EC", bits: c?.bits, curve: c?.name ?? oid(params) };
  }
  if (algorithm === "DSA" && params) {
    return { algorithm, bits: intBits(children(params)[0]) };
  }
  if (algorithm === "Ed25519" || algorithm === "X25519") return { algorithm, bits: 256 };
  if (algorithm === "Ed448" || algorithm === "X448") return { algorithm, bits: 448 };
  return { algorithm };
}
function pkcs8Info(der) {
  const [, algId, priv] = children(parse(der));
  const [algOid, params] = children(algId);
  const algorithm = OIDS[oid(algOid)] ?? `OID ${oid(algOid)}`;
  if (algorithm === "RSA" || algorithm === "RSA-PSS") return { algorithm, bits: pkcs1Bits(content(priv)) };
  if (algorithm === "EC" && params?.tag === 6) {
    const c = CURVES[oid(params)];
    return { algorithm, bits: c?.bits, curve: c?.name };
  }
  if (algorithm === "DSA" && params) return { algorithm, bits: intBits(children(params)[0]) };
  if (algorithm === "Ed25519" || algorithm === "X25519") return { algorithm, bits: 256 };
  return { algorithm };
}
function pkcs1Bits(der) {
  return intBits(children(parse(der))[1]);
}
function pkcs1PublicBits(der) {
  return intBits(children(parse(der))[0]);
}
function sec1Info(der) {
  const params = children(parse(der)).find((n) => n.tag === 160);
  if (params) {
    const c = CURVES[oid(children(params)[0])];
    if (c) return { algorithm: "EC", bits: c.bits, curve: c.name };
  }
  return { algorithm: "EC" };
}
function nameString(n) {
  const short = { "2.5.4.3": "CN", "2.5.4.10": "O", "2.5.4.11": "OU", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST" };
  const parts2 = [];
  for (const rdn of children(n))
    for (const atv of children(rdn)) {
      const [t, v] = children(atv);
      const k = short[oid(t)];
      if (k) parts2.push(`${k}=${new TextDecoder().decode(content(v))}`);
    }
  return parts2.join(", ");
}
function time(n) {
  const s = new TextDecoder().decode(content(n));
  const full = n.tag === 23 ? (Number(s.slice(0, 2)) >= 50 ? "19" : "20") + s : s;
  return `${full.slice(0, 4)}-${full.slice(4, 6)}-${full.slice(6, 8)}T${full.slice(8, 10)}:${full.slice(10, 12)}:${full.slice(12, 14)}Z`;
}
function certInfo(der) {
  const [tbs, sigAlg] = children(parse(der));
  const t = children(tbs);
  const off = t[0].tag === 160 ? 1 : 0;
  const issuer = t[2 + off];
  const validity = children(t[3 + off]);
  const subject = t[4 + off];
  const spki = t[5 + off];
  const sigOid = oid(children(sigAlg)[0]);
  return {
    ...spkiInfo(spki),
    signatureAlgorithm: SIG_OIDS[sigOid] ?? `OID ${sigOid}`,
    issuer: nameString(issuer),
    subject: nameString(subject),
    notBefore: time(validity[0]),
    notAfter: time(validity[1])
  };
}
function base64ToBytes(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  const bin = atob(clean);
  const out3 = new Uint8Array(bin.length);
  for (let i2 = 0; i2 < bin.length; i2++) out3[i2] = bin.charCodeAt(i2);
  return out3;
}
function sshPublicKeyInfo(blob) {
  const dv = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  let p = 0;
  const next = () => {
    const len = dv.getUint32(p);
    const v = blob.subarray(p + 4, p + 4 + len);
    p += 4 + len;
    return v;
  };
  const type = new TextDecoder().decode(next());
  if (type === "ssh-rsa") {
    next();
    const n = next();
    let i2 = 0;
    while (i2 < n.length - 1 && n[i2] === 0) i2++;
    return { algorithm: "RSA", bits: (n.length - i2 - 1) * 8 + (32 - Math.clz32(n[i2])) };
  }
  if (type === "ssh-dss") {
    const pr = next();
    let i2 = 0;
    while (i2 < pr.length - 1 && pr[i2] === 0) i2++;
    return { algorithm: "DSA", bits: (pr.length - i2) * 8 };
  }
  if (type.startsWith("ecdsa-sha2-nistp")) {
    const bits = Number(type.slice("ecdsa-sha2-nistp".length));
    return { algorithm: "EC", bits, curve: `P-${bits}` };
  }
  if (type === "ssh-ed25519" || type === "sk-ssh-ed25519@openssh.com") return { algorithm: "Ed25519", bits: 256 };
  if (type === "sk-ecdsa-sha2-nistp256@openssh.com") return { algorithm: "EC", bits: 256, curve: "P-256" };
  return { algorithm: type };
}
function opensshPrivateKeyInfo(der) {
  const magic = "openssh-key-v1\0";
  const dv = new DataView(der.buffer, der.byteOffset, der.byteLength);
  let p = magic.length;
  const next = () => {
    const len = dv.getUint32(p);
    const v = der.subarray(p + 4, p + 4 + len);
    p += 4 + len;
    return v;
  };
  const cipher = new TextDecoder().decode(next());
  next();
  next();
  p += 4;
  const pub = next();
  return { ...sshPublicKeyInfo(pub), encrypted: cipher !== "none" };
}

// src/matchers/pem.ts
var PEM_RE = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;
var SSH_PUB_RE = /(?:^|\s)(ssh-rsa|ssh-dss|ssh-ed25519|ecdsa-sha2-nistp(?:256|384|521)|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com) (AAAA[A-Za-z0-9+/=]+)/g;
var PQ = /^(ML-KEM|ML-DSA|SLH-DSA)/;
function label(k) {
  if (k.algorithm === "EC") return k.curve ? `ECC ${k.curve}` : "ECC";
  return k.bits && /^(RSA|DSA|DH)/.test(k.algorithm) ? `${k.algorithm}-${k.bits}` : k.algorithm;
}
function risk(k) {
  if (PQ.test(k.algorithm)) return "NONE";
  if ((k.algorithm === "RSA" || k.algorithm === "DSA") && k.bits && k.bits < 2048) return "CLASSICAL_BROKEN";
  if (k.algorithm === "DSA") return "CLASSICAL_BROKEN";
  return "HIGH";
}
var primitiveOf = (k) => /X25519|X448|DH/.test(k.algorithm) ? "key-agreement" : PQ.test(k.algorithm) && k.algorithm.startsWith("ML-KEM") ? "kem" : k.algorithm === "RSA" ? "pke" : "signature";
var lineAt = (text, offset) => text.slice(0, offset).split("\n").length;
function scanKeyMaterial(file, text) {
  const out3 = [];
  for (const m of text.matchAll(PEM_RE)) {
    const type = m[1];
    const line = lineAt(text, m.index);
    const body2 = m[2].replace(/^[A-Za-z-]+:.*$/gm, "");
    const encryptedHeader = /Proc-Type:\s*4,ENCRYPTED/.test(m[2]);
    const base = { file, line, column: 1, kind: "pem", confidence: "high" };
    try {
      const der = base64ToBytes(body2);
      if (type === "CERTIFICATE" || type === "TRUSTED CERTIFICATE") {
        const c = certInfo(der);
        const weakSig = /md5|sha1|SHA1/i.test(c.signatureAlgorithm);
        out3.push({
          ...base,
          ruleId: "pem-certificate",
          snippet: `-----BEGIN ${type}----- (${label(c)}, ${c.signatureAlgorithm})`,
          algorithm: label(c),
          keySize: c.bits,
          parameter: c.curve,
          primitive: "signature",
          quantumRisk: weakSig ? "CLASSICAL_BROKEN" : risk(c),
          fixId: "certificate-classical",
          assetType: "certificate",
          message: `X.509 certificate with a ${label(c)} key, signed with ${c.signatureAlgorithm}${weakSig ? " (SHA-1/MD5 signatures are already deprecated)" : ""}. Expires ${c.notAfter.slice(0, 10)}.`,
          details: { subject: c.subject, issuer: c.issuer, notBefore: c.notBefore, notAfter: c.notAfter, signatureAlgorithm: c.signatureAlgorithm }
        });
        continue;
      }
      let k = null;
      let isPrivate = false;
      let encrypted = encryptedHeader;
      switch (type) {
        case "PUBLIC KEY":
          k = spkiInfo(parse(der));
          break;
        case "RSA PUBLIC KEY":
          k = { algorithm: "RSA", bits: pkcs1PublicBits(der) };
          break;
        case "PRIVATE KEY":
          k = pkcs8Info(der);
          isPrivate = true;
          break;
        case "RSA PRIVATE KEY":
          isPrivate = true;
          k = encrypted ? { algorithm: "RSA" } : { algorithm: "RSA", bits: pkcs1Bits(der) };
          break;
        case "EC PRIVATE KEY":
          isPrivate = true;
          k = encrypted ? { algorithm: "EC" } : sec1Info(der);
          break;
        case "DSA PRIVATE KEY":
          isPrivate = true;
          k = { algorithm: "DSA" };
          break;
        case "OPENSSH PRIVATE KEY": {
          isPrivate = true;
          const info2 = opensshPrivateKeyInfo(der);
          encrypted = info2.encrypted;
          k = info2;
          break;
        }
        case "ENCRYPTED PRIVATE KEY":
          isPrivate = true;
          encrypted = true;
          k = { algorithm: "unknown (encrypted)" };
          break;
        case "CERTIFICATE REQUEST":
          continue;
        default:
          continue;
      }
      if (!k) continue;
      if (isPrivate) {
        out3.push({
          ...base,
          ruleId: "pem-private-key",
          snippet: `-----BEGIN ${type}----- [private key contents redacted]`,
          algorithm: label(k),
          keySize: k.bits,
          parameter: k.curve,
          primitive: primitiveOf(k),
          quantumRisk: k.algorithm.startsWith("unknown") ? "HIGH" : risk(k),
          fixId: "private-key-in-repo",
          assetType: "related-crypto-material",
          message: `Private key file found (${label(k)}${encrypted ? ", passphrase-protected" : ""}) \u2014 remove it from the repository and rotate it.`,
          details: { materialType: "private-key" }
        });
      } else {
        out3.push({
          ...base,
          ruleId: "pem-public-key",
          snippet: `-----BEGIN ${type}----- (${label(k)})`,
          algorithm: label(k),
          keySize: k.bits,
          parameter: k.curve,
          primitive: primitiveOf(k),
          quantumRisk: risk(k),
          fixId: k.algorithm === "RSA" ? "rsa-to-mlkem" : "signatures-to-mldsa",
          assetType: "related-crypto-material",
          message: `Public key (${label(k)}) \u2014 not quantum-safe.`,
          details: { materialType: "public-key" }
        });
      }
    } catch {
      out3.push({
        ...base,
        ruleId: type.includes("PRIVATE") ? "pem-private-key" : "pem-unparsed",
        snippet: `-----BEGIN ${type}----- [contents redacted]`,
        algorithm: "unknown",
        primitive: "signature",
        quantumRisk: type.includes("PRIVATE") ? "HIGH" : "NONE",
        confidence: "low",
        fixId: type.includes("PRIVATE") ? "private-key-in-repo" : void 0,
        assetType: "related-crypto-material",
        message: type.includes("PRIVATE") ? "Private key block found (could not be decoded) \u2014 remove it from the repository and rotate it." : `PEM block "${type}" could not be decoded.`
      });
    }
  }
  for (const m of text.matchAll(SSH_PUB_RE)) {
    const offset = m.index + m[0].indexOf(m[1]);
    const line = lineAt(text, offset);
    try {
      const k = sshPublicKeyInfo(base64ToBytes(m[2]));
      out3.push({
        ruleId: "ssh-public-key",
        file,
        line,
        column: 1,
        kind: "pem",
        confidence: "high",
        snippet: `${m[1]} AAAA\u2026 (${label(k)})`,
        algorithm: label(k),
        keySize: k.bits,
        parameter: k.curve,
        primitive: "signature",
        quantumRisk: risk(k),
        fixId: "ssh-keys",
        assetType: "related-crypto-material",
        message: `SSH public key (${label(k)}) \u2014 SSH signatures are still classical; key exchange can already be post-quantum.`,
        details: { materialType: "public-key" }
      });
    } catch {
    }
  }
  return out3;
}

// src/matchers/manifest.ts
var lineOf = (text, index) => text.slice(0, index).split("\n").length;
function findLine(text, needle) {
  const i2 = text.indexOf(needle);
  return i2 < 0 ? 1 : lineOf(text, i2);
}
function extractDependencies(path, text) {
  const b = basename(path);
  const deps = [];
  if (b === "package.json") {
    try {
      const j = JSON.parse(text);
      for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
        for (const [name2, version] of Object.entries(j[field] ?? {}))
          deps.push({ name: name2, version: String(version), line: findLine(text, `"${name2}"`), ecosystem: "npm" });
      }
      const engines = j.engines?.node;
      if (engines) deps.push({ name: "node", version: engines, line: findLine(text, '"engines"'), ecosystem: "npm" });
    } catch {
    }
    return deps;
  }
  if (/^requirements.*\.txt$/i.test(b)) {
    text.split("\n").forEach((raw, i2) => {
      const l = raw.replace(/#.*/, "").trim();
      const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?\s*(?:[<>=!~]=?\s*([\w.*+-]+))?/.exec(l);
      if (m && !l.startsWith("-")) deps.push({ name: m[1], version: m[2], line: i2 + 1, ecosystem: "pypi" });
    });
    return deps;
  }
  if (b === "pyproject.toml" || b === "setup.py" || b === "setup.cfg" || b === "Pipfile") {
    text.split("\n").forEach((raw, i2) => {
      const l = raw.replace(/#.*/, "");
      for (const m of l.matchAll(/["']([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?\s*(?:(?:[<>=!~]=?|\^)\s*([\w.*+-]+))?[^"']*["']/g))
        deps.push({ name: m[1], version: m[2], line: i2 + 1, ecosystem: "pypi" });
      const t = /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*=\s*(?:\{[^}]*version\s*=\s*)?["']([^"']*)["']/.exec(l);
      if (t && !["name", "version", "description", "python", "readme", "license", "requires-python", "build-backend"].includes(t[1]))
        deps.push({ name: t[1], version: t[2].replace(/^[\^~>=<]+/, ""), line: i2 + 1, ecosystem: "pypi" });
    });
    return deps;
  }
  if (b === "pom.xml") {
    for (const m of text.matchAll(/<groupId>\s*([^<\s]+)\s*<\/groupId>\s*<artifactId>\s*([^<\s]+)\s*<\/artifactId>(?:\s*<version>\s*([^<\s]+)\s*<\/version>)?/g))
      deps.push({ name: `${m[1]}:${m[2]}`, version: m[3], line: lineOf(text, m.index), ecosystem: "maven" });
    return deps;
  }
  if (b === "build.gradle" || b === "build.gradle.kts") {
    for (const m of text.matchAll(/["']([\w.-]+):([\w.-]+)(?::([\w.+-]+))?["']/g))
      deps.push({ name: `${m[1]}:${m[2]}`, version: m[3], line: lineOf(text, m.index), ecosystem: "maven" });
    return deps;
  }
  if (b === "go.mod") {
    text.split("\n").forEach((raw, i2) => {
      const l = raw.replace(/\/\/.*/, "");
      const go = /^\s*go\s+(\d+\.\d+(?:\.\d+)?)\s*$/.exec(l);
      if (go) deps.push({ name: "go", version: go[1], line: i2 + 1, ecosystem: "go" });
      const m = /^\s*(?:require\s+)?([a-z0-9.-]+\.[a-z]{2,}\/[\w./-]+)\s+(v[\w.+-]+)/i.exec(l);
      if (m) deps.push({ name: m[1], version: m[2], line: i2 + 1, ecosystem: "go" });
    });
    return deps;
  }
  return deps;
}
function versionBelow(v, threshold) {
  if (!v) return false;
  const m = /(\d+(?:\.\d+)*)/.exec(v.replace(/^v/, ""));
  if (!m) return false;
  const a = m[1].split(".").map(Number);
  const b = threshold.split(".").map(Number);
  for (let i2 = 0; i2 < Math.max(a.length, b.length); i2++) {
    const x = a[i2] ?? 0;
    const y = b[i2] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

// src/scores.ts
var RISK_WEIGHTS = {
  // Key agreement / KEM protect data in transit (harvest-now-decrypt-later) and
  // long-lived signatures/keys anchor trust for years, so they weigh most.
  HIGH: { "key-agreement": 10, kem: 10, pke: 8, signature: 8, default: 6 },
  CLASSICAL_BROKEN: 3,
  LOW: 1,
  NONE: 0
};
var CONFIDENCE_FACTOR = { high: 1, medium: 0.7, low: 0.4 };
function findingWeight(f) {
  const base = f.quantumRisk === "HIGH" ? RISK_WEIGHTS.HIGH[f.primitive] ?? RISK_WEIGHTS.HIGH.default : RISK_WEIGHTS[f.quantumRisk];
  return base * CONFIDENCE_FACTOR[f.confidence];
}
function exposureScore(findings, filesScanned) {
  const weighted = findings.reduce((s, f) => s + findingWeight(f), 0);
  const scale = 6 * Math.log2(2 + Math.max(0, filesScanned));
  const score = Math.round(100 * (1 - Math.exp(-weighted / scale)));
  return { score, weighted: Math.round(weighted * 10) / 10, scale: Math.round(scale * 10) / 10 };
}
function agilityScore(findings) {
  const hard = findings.filter((f) => (f.kind === "treesitter" || f.kind === "regex") && f.quantumRisk !== "NONE");
  const files = new Set(hard.map((f) => f.file)).size;
  if (hard.length === 0) return { score: 100, hardcoded: 0, files: 0 };
  const score = Math.round(100 * Math.max(0, Math.min(1, 1 - (files - 1) / hard.length)));
  return { score, hardcoded: hard.length, files };
}
function computeScores(findings, filesScanned) {
  const e = exposureScore(findings, filesScanned);
  const a = agilityScore(findings);
  const count = (pred) => findings.filter(pred).length;
  return {
    exposure: e.score,
    agility: a.score,
    exposureInputs: [
      { label: "HIGH (Shor) key agreement / KEM", value: count((f) => f.quantumRisk === "HIGH" && (f.primitive === "key-agreement" || f.primitive === "kem")) },
      { label: "HIGH (Shor) public-key encryption", value: count((f) => f.quantumRisk === "HIGH" && f.primitive === "pke") },
      { label: "HIGH (Shor) signatures", value: count((f) => f.quantumRisk === "HIGH" && f.primitive === "signature") },
      { label: "Classically broken (MD5, SHA-1, DES, RC4, short RSA\u2026)", value: count((f) => f.quantumRisk === "CLASSICAL_BROKEN") },
      { label: "LOW (Grover) \u2014 e.g. AES-128", value: count((f) => f.quantumRisk === "LOW") },
      { label: "Confidence-weighted sum", value: e.weighted },
      { label: "Files analysed", value: filesScanned },
      { label: "Size scale 6 \xD7 log2(2 + files)", value: e.scale }
    ],
    agilityInputs: [
      { label: "Hardcoded algorithm choices (code + config findings)", value: a.hardcoded },
      { label: "Distinct files containing them", value: a.files },
      { label: "Formula", value: "100 \xD7 (1 \u2212 (files \u2212 1) / hardcoded)" }
    ]
  };
}

// generated/rules.json
var rules_default = [
  {
    id: "nginx-ecdh-curve",
    kind: "regex",
    files: [
      "*.conf",
      "nginx*",
      "*.nginx",
      "*.vhost",
      "sites-available/*",
      "sites-enabled/*"
    ],
    pattern: "^[ \\t]*ssl_ecdh_curve[ \\t]+(?<alg>[^;\\n]+);",
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "mlkem",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "TLS groups without ML-KEM",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-nginx-pq",
    message: "nginx ssl_ecdh_curve offers no post-quantum hybrid \u2014 connections use classical key exchange.",
    confidence: "medium"
  },
  {
    id: "nginx-ssl-protocols-legacy",
    kind: "regex",
    files: [
      "*.conf",
      "nginx*",
      "*.nginx",
      "*.vhost",
      "sites-available/*",
      "sites-enabled/*"
    ],
    pattern: "^[ \\t]*ssl_protocols[ \\t]+(?<alg>[^;\\n]+);",
    flags: "im",
    variants: [
      {
        match: "(^|\\s)(SSLv2|SSLv3|TLSv1|TLSv1\\.1)(\\s|$)",
        parameter: "1.0/1.1"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "nginx ssl_protocols still enables TLS 1.0/1.1 (deprecated by RFC 8996).",
    confidence: "medium"
  },
  {
    id: "nginx-ssl-protocols-no-tls13",
    kind: "regex",
    files: [
      "*.conf",
      "nginx*",
      "*.nginx",
      "*.vhost",
      "sites-available/*",
      "sites-enabled/*"
    ],
    pattern: "^[ \\t]*ssl_protocols[ \\t]+(?<alg>[^;\\n]+);",
    flags: "im",
    variants: [
      {
        match: "TLSv1\\.3",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "TLS without 1.3",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-nginx-pq",
    message: "nginx ssl_protocols lacks TLSv1.3 \u2014 post-quantum key exchange impossible.",
    confidence: "medium"
  },
  {
    id: "nginx-ssl-ciphers-weak",
    kind: "regex",
    files: [
      "*.conf",
      "nginx*",
      "*.nginx",
      "*.vhost"
    ],
    pattern: `^[ \\t]*ssl_ciphers[ \\t]+['"]?(?<alg>[^;'"\\n]+)`,
    flags: "im",
    variants: [
      {
        match: "(^|:)(?!!)[A-Z0-9-]*(RC4|DES|NULL|EXPORT|MD5)",
        algorithm: "RC4/3DES/NULL cipher suites"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "Weak cipher suites",
    primitive: "symmetric",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "legacy-ciphers",
    message: "ssl_ciphers enables RC4/DES/NULL/EXPORT/MD5 suites.",
    confidence: "medium"
  },
  {
    id: "apache-curves",
    kind: "regex",
    files: [
      "*.conf",
      "httpd*",
      "apache*",
      "ssl.conf",
      ".htaccess"
    ],
    pattern: "^[ \\t]*SSLOpenSSLConfCmd[ \\t]+(Curves|Groups)[ \\t]+(?<alg>\\S+)",
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "mlkem",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "TLS groups without ML-KEM",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-apache-pq",
    message: "Apache SSLOpenSSLConfCmd Curves/Groups offers no post-quantum hybrid.",
    confidence: "medium"
  },
  {
    id: "apache-protocol-legacy",
    kind: "regex",
    files: [
      "*.conf",
      "httpd*",
      "apache*",
      "ssl.conf",
      ".htaccess"
    ],
    pattern: "^[ \\t]*SSLProtocol[ \\t]+(?<alg>[^\\n#]+)",
    flags: "im",
    variants: [
      {
        match: "(^|\\s)\\+?(SSLv3|TLSv1|TLSv1\\.1)(\\s|$)",
        parameter: "1.0/1.1"
      },
      {
        match: "^(?!.*-TLSv1(\\s|$)).*(^|\\s)all(\\s|$)",
        parameter: "1.0/1.1"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-apache-pq",
    message: 'Apache SSLProtocol still enables TLS 1.0/1.1 ("all" includes them unless removed).',
    confidence: "medium"
  },
  {
    id: "haproxy-curves",
    kind: "regex",
    files: [
      "haproxy*.cfg",
      "haproxy*.conf",
      "*.cfg"
    ],
    pattern: "(?:^|\\s)(?:ssl-default-bind-curves|ssl-default-server-curves|curves)[ \\t]+(?<alg>[\\w:.-]+)",
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "mlkem",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "TLS groups without ML-KEM",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-haproxy-pq",
    message: "HAProxy curves list offers no post-quantum hybrid.",
    confidence: "medium"
  },
  {
    id: "haproxy-min-ver",
    kind: "regex",
    files: [
      "haproxy*.cfg",
      "haproxy*.conf",
      "*.cfg"
    ],
    pattern: "ssl-min-ver[ \\t]+(?<alg>SSLv3|TLSv1\\.0|TLSv1\\.1)\\b",
    flags: "im",
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "HAProxy ssl-min-ver allows deprecated TLS versions.",
    confidence: "medium"
  },
  {
    id: "openssl-cnf-groups",
    kind: "regex",
    files: [
      "openssl*.cnf",
      "*.cnf"
    ],
    pattern: "^[ \\t]*(Groups|Curves)[ \\t]*=[ \\t]*(?<alg>[^\\n#]+)",
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "mlkem",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "TLS groups without ML-KEM",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-openssl-cnf-pq",
    message: "openssl.cnf group list overrides the post-quantum default with classical groups only.",
    confidence: "medium"
  },
  {
    id: "openssl-cnf-minprotocol",
    kind: "regex",
    files: [
      "openssl*.cnf",
      "*.cnf"
    ],
    pattern: "^[ \\t]*MinProtocol[ \\t]*=[ \\t]*(?<alg>SSLv3|TLSv1|TLSv1\\.1)[ \\t]*$",
    flags: "im",
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "openssl.cnf MinProtocol allows deprecated TLS versions.",
    confidence: "medium"
  },
  {
    id: "docker-old-tls-stack",
    kind: "regex",
    files: [
      "Dockerfile",
      "Dockerfile.*",
      "*.dockerfile",
      "Containerfile"
    ],
    pattern: "^[ \\t]*FROM[ \\t]+(?:--platform=\\S+[ \\t]+)?(?<alg>\\S+)",
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "(^|/)debian:(stretch|buster|bullseye|bookworm|9|10|11|12)\\b",
        algorithm: "Debian \u2264 12 (OpenSSL < 3.5)"
      },
      {
        match: "(^|/)ubuntu:(xenial|bionic|focal|jammy|noble|oracular|plucky|1[0-9]\\.\\d+|2[0-4]\\.\\d+|25\\.04)\\b",
        algorithm: "Ubuntu \u2264 25.04 (OpenSSL < 3.5)"
      },
      {
        match: "(^|/)alpine:3\\.([0-9]|1[0-9]|2[01])(\\.|$|-)",
        algorithm: "Alpine \u2264 3.21 (OpenSSL < 3.5)"
      },
      {
        match: "(^|/)(centos|amazonlinux:2\\b|rockylinux:8|almalinux:8)",
        algorithm: "EL8 / CentOS / AL2 (OpenSSL < 3.5)"
      },
      {
        match: "-(stretch|buster|bullseye|bookworm|focal|jammy|noble)\\b",
        algorithm: "Debian/Ubuntu-based image (OpenSSL < 3.5)"
      },
      {
        match: "(^|/)golang:1\\.(1[0-9]|2[0-3])\\b",
        algorithm: "Go < 1.24 toolchain (no PQ TLS default)",
        fix: "go-tls-pq"
      },
      {
        match: "(^|/)node:(1[0-9]|20|21|23)(\\b|$)",
        algorithm: "Node.js < 22.20 (OpenSSL < 3.5)",
        fix: "node-tls-pq"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS stack without ML-KEM",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "docker-openssl",
    message: "Base image ships a TLS stack that cannot negotiate X25519MLKEM768."
  },
  {
    id: "docker-apt-old-openssl",
    kind: "regex",
    files: [
      "Dockerfile",
      "Dockerfile.*",
      "*.dockerfile",
      "Containerfile"
    ],
    pattern: "(?:apt-get|apt|apk|yum|dnf)[ \\t]+(?:-\\S+[ \\t]+)*(?:install|add)[^\\n]*?\\b(?<alg>openssl=1\\.[\\w.*-]*|openssl=3\\.[0-4][\\w.*-]*|libssl1\\.\\d|openssl1\\.1[\\w-]*|openssl-1\\.[\\w.*-]*)",
    flags: "im",
    algorithm: "OpenSSL < 3.5 pinned",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "docker-openssl",
    message: "Image pins an OpenSSL version that cannot negotiate X25519MLKEM768.",
    confidence: "medium"
  },
  {
    id: "terraform-aws-ssl-policy",
    kind: "regex",
    files: [
      "*.tf",
      "*.tf.json",
      "*.yaml",
      "*.yml",
      "*.json",
      "*.template"
    ],
    pattern: `(?:ssl_?policy|SslPolicy)['"]?[ \\t]*[=:][ \\t]*['"](?<alg>ELBSecurityPolicy-[\\w.-]+)['"]`,
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "-PQ-",
        skip: true
      },
      {
        match: "(TLS-1-0|TLS-1-1|2015-0|2016-08|FS-2018|FS-1-1|TLS13-1-0|TLS13-1-1)",
        algorithm: "ELB policy allowing TLS 1.0/1.1 without PQ",
        quantum_risk: "CLASSICAL_BROKEN"
      },
      {
        match: ".",
        algorithm: "ELB policy without PQ hybrid"
      }
    ],
    algorithm: "ELB policy without PQ hybrid",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "cloud-tls-policy",
    message: "AWS load-balancer TLS policy offers no post-quantum hybrid (use a *-PQ-2025-09 policy).",
    confidence: "medium"
  },
  {
    id: "terraform-min-tls-version",
    kind: "regex",
    files: [
      "*.tf",
      "*.tf.json",
      "*.yaml",
      "*.yml",
      "*.json",
      "*.bicep"
    ],
    pattern: `(?:minimum_protocol_version|min_tls_version|minimum_tls_version|minTlsVersion|MinimumProtocolVersion)['"]?[ \\t]*[=:][ \\t]*['"](?<alg>[^'"]+)['"]`,
    flags: "im",
    variants: [
      {
        match: "^(SSLv3|TLSv1|TLSv1_2016|TLSv1\\.1_2016|1\\.0|1\\.1|TLS1_0|TLS1_1|TLS_1_0|TLS_1_1|Tls|Tls11)$"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "cloud-tls-policy",
    message: "Cloud resource allows TLS 1.0/1.1.",
    confidence: "medium"
  },
  {
    id: "k8s-ingress-ssl-protocols",
    kind: "regex",
    files: [
      "*.yaml",
      "*.yml"
    ],
    pattern: `^[ \\t]*ssl-protocols:[ \\t]*['"]?(?<alg>[^'"\\n]+)`,
    flags: "im",
    variants: [
      {
        match: "(^|\\s)(SSLv3|TLSv1|TLSv1\\.1)(\\s|$)"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "k8s-ingress-tls",
    message: "Ingress ssl-protocols still enables TLS 1.0/1.1.",
    confidence: "medium"
  },
  {
    id: "k8s-ingress-ecdh-curve",
    kind: "regex",
    files: [
      "*.yaml",
      "*.yml"
    ],
    pattern: `^[ \\t]*ssl-ecdh-curve:[ \\t]*['"]?(?<alg>[^'"\\n]+)`,
    flags: "im",
    parameter: "group:alg",
    variants: [
      {
        match: "mlkem|^auto$",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "TLS groups without ML-KEM",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "k8s-ingress-tls",
    message: "Ingress ssl-ecdh-curve offers no post-quantum hybrid.",
    confidence: "medium"
  },
  {
    id: "mesh-min-protocol",
    kind: "regex",
    files: [
      "*.yaml",
      "*.yml"
    ],
    pattern: "^[ \\t]*(?:minProtocolVersion|tls_minimum_protocol_version):[ \\t]*(?<alg>TLSV1_0|TLSV1_1|TLSv1_0|TLSv1_1)\\b",
    flags: "im",
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "k8s-ingress-tls",
    message: "Service mesh / proxy allows TLS 1.0/1.1.",
    confidence: "medium"
  },
  {
    id: "spring-ssl-protocols",
    kind: "regex",
    files: [
      "application*.properties",
      "application*.yml",
      "application*.yaml"
    ],
    pattern: "(?:server\\.ssl\\.(?:enabled-protocols|protocol)|enabled-protocols)[ \\t]*[=:][ \\t]*(?<alg>[^\\n]+)",
    flags: "im",
    variants: [
      {
        match: "(^|[\\s,\\[])(SSLv3|TLSv1|TLSv1\\.1)($|[\\s,\\]])"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS 1.0/1.1",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "Spring Boot server SSL enables TLS 1.0/1.1.",
    confidence: "medium"
  },
  {
    id: "sshd-kex-classical",
    kind: "regex",
    files: [
      "sshd_config",
      "ssh_config",
      "*.sshd_config",
      "sshd_config.d/*"
    ],
    pattern: "^[ \\t]*KexAlgorithms[ \\t]+(?<alg>\\S+)",
    flags: "im",
    variants: [
      {
        match: "mlkem|sntrup",
        skip: true
      },
      {
        match: "^[+^-]",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "SSH KEX without PQ hybrid",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "ssh-keys",
    message: "SSH KexAlgorithms list excludes post-quantum hybrids (mlkem768x25519-sha256 / sntrup761x25519-sha512).",
    confidence: "medium"
  },
  {
    id: "go-crypto-import",
    language: [
      "go"
    ],
    kind: "treesitter",
    query: "(import_spec path: (interpreted_string_literal) @path) @match",
    variant_from: "capture:path",
    variants: [
      {
        match: "^crypto/rsa$",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "^crypto/ecdsa$",
        algorithm: "ECDSA",
        primitive: "signature"
      },
      {
        match: "^(crypto|golang\\.org/x/crypto)/ed25519$",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: "^crypto/elliptic$",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "^crypto/dsa$",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: "^crypto/ecdh$",
        algorithm: "ECDH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^golang\\.org/x/crypto/curve25519$",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^crypto/md5$",
        algorithm: "MD5",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1",
        message: "Imports crypto/md5 \u2014 collision attacks exist today."
      },
      {
        match: "^crypto/sha1$",
        algorithm: "SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1",
        message: "Imports crypto/sha1 \u2014 collision attacks exist today."
      },
      {
        match: "^crypto/des$",
        algorithm: "DES/3DES",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "Imports crypto/des \u2014 legacy cipher."
      },
      {
        match: "^crypto/rc4$",
        algorithm: "RC4",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "Imports crypto/rc4 \u2014 legacy cipher."
      },
      {
        match: "^crypto/mlkem$",
        algorithm: "ML-KEM",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Imports crypto/mlkem \u2014 post-quantum."
      },
      {
        match: "^crypto/mldsa$",
        algorithm: "ML-DSA",
        primitive: "signature",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Imports crypto/mldsa \u2014 post-quantum."
      },
      {
        match: "^github\\.com/cloudflare/circl/(kem|sign)/(mlkem|mldsa)",
        algorithm: "ML-KEM/ML-DSA",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Imports CIRCL post-quantum package."
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "go-crypto-migration",
    message: "Imports a classical public-key package \u2014 not quantum-safe."
  },
  {
    id: "go-rsa-generate",
    language: [
      "go"
    ],
    kind: "treesitter",
    callee: "^rsa\\.GenerateKey$",
    key_size: "arg1",
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    fix: "go-crypto-migration",
    message: "RSA key generation \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "go-ecdsa-generate",
    language: [
      "go"
    ],
    kind: "treesitter",
    callee: "^ecdsa\\.GenerateKey$",
    parameter: "regex:elliptic\\.(P\\d+)",
    algorithm: "ECDSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "go-crypto-migration",
    message: "ECDSA key generation \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "go-ecdh-curve",
    language: [
      "go"
    ],
    kind: "treesitter",
    callee: "^ecdh\\.(P256|P384|P521|X25519)$",
    variant_from: "callee",
    variants: [
      {
        match: "X25519",
        algorithm: "X25519"
      },
      {
        match: "P(\\d+)",
        algorithm: "ECDH"
      }
    ],
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "ecdh-to-hybrid",
    message: "ECDH key agreement \u2014 exposed to harvest-now-decrypt-later.",
    confidence: "high"
  },
  {
    id: "go-tls-curve-preferences",
    language: [
      "go"
    ],
    kind: "treesitter",
    query: '((keyed_element . (literal_element (identifier) @key) . (literal_element) @val) @match\n  (#eq? @key "CurvePreferences"))\n',
    variant_from: "capture:val",
    variants: [
      {
        match: "MLKEM",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "go-tls-pq",
    message: "tls.Config CurvePreferences excludes the post-quantum hybrid (X25519MLKEM768).",
    confidence: "high"
  },
  {
    id: "go-tls-version",
    language: [
      "go"
    ],
    kind: "treesitter",
    query: '((keyed_element . (literal_element (identifier) @key) . (literal_element) @val) @match\n  (#match? @key "^(MinVersion|MaxVersion)$"))\n',
    variant_from: "match",
    variants: [
      {
        match: "MinVersion\\s*:\\s*tls\\.Version(TLS10|TLS11|SSL30)\\b",
        algorithm: "TLS 1.0/1.1",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "tls-legacy-protocols",
        message: "tls.Config MinVersion allows deprecated TLS 1.0/1.1."
      },
      {
        match: "MaxVersion\\s*:\\s*tls\\.Version(TLS10|TLS11|TLS12)\\b",
        algorithm: "TLS \u2264 1.2",
        quantum_risk: "HIGH",
        fix: "go-tls-pq",
        message: "tls.Config MaxVersion below TLS 1.3 \u2014 post-quantum key exchange impossible."
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    message: "TLS version setting.",
    confidence: "high"
  },
  {
    id: "java-keypairgenerator",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)KeyPairGenerator\\.getInstance$",
    variants: [
      {
        match: "^RSASSA-PSS$",
        algorithm: "RSA-PSS",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^RSA$",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "^(EC|ECDSA)$",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "^(DH|DiffieHellman)$",
        algorithm: "DH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^DSA$",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: "^(Ed25519|Ed448|EdDSA)$",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: "^(X25519|X448|XDH)$",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^ML-KEM",
        algorithm: "ML-KEM",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-KEM key generation."
      },
      {
        match: "^ML-DSA",
        algorithm: "ML-DSA",
        primitive: "signature",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-DSA key generation."
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    fix: "java-mlkem",
    message: "KeyPairGenerator with a classical algorithm \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "java-keyagreement",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)KeyAgreement\\.getInstance$",
    variants: [
      {
        match: "^ECDH",
        algorithm: "ECDH"
      },
      {
        match: "^(DH|DiffieHellman)$",
        algorithm: "DH"
      },
      {
        match: "^(X25519|X448|XDH)$",
        algorithm: "X25519"
      }
    ],
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "java-mlkem",
    message: "Classical key agreement \u2014 exposed to harvest-now-decrypt-later.",
    confidence: "high"
  },
  {
    id: "java-signature",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)Signature\\.getInstance$",
    variants: [
      {
        match: "andMGF1|RSASSA-PSS",
        algorithm: "RSA-PSS"
      },
      {
        match: "withRSA",
        algorithm: "RSA"
      },
      {
        match: "ECDSA",
        algorithm: "ECDSA"
      },
      {
        match: "withDSA|^DSA$",
        algorithm: "DSA"
      },
      {
        match: "^(Ed25519|Ed448|EdDSA)$",
        algorithm: "Ed25519"
      },
      {
        match: "^ML-DSA",
        algorithm: "ML-DSA",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-DSA signature."
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "Classical digital signature \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "java-signature-weak-hash",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)Signature\\.getInstance$",
    args: {
      "0": "^(MD2|MD5|SHA1|SHA-1)with"
    },
    variants: [
      {
        match: "^MD",
        algorithm: "MD5"
      },
      {
        match: "^SHA",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "SHA-1",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "Signature over an MD5/SHA-1 digest \u2014 already deprecated.",
    confidence: "high"
  },
  {
    id: "java-cipher",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)Cipher\\.getInstance$",
    variants: [
      {
        match: "^RSA",
        algorithm: "RSA",
        primitive: "pke",
        quantum_risk: "HIGH",
        fix: "java-mlkem",
        message: "RSA encryption \u2014 not quantum-safe."
      },
      {
        match: "^ECIES",
        algorithm: "ECIES",
        primitive: "pke",
        quantum_risk: "HIGH",
        fix: "java-mlkem",
        message: "ECIES encryption \u2014 not quantum-safe."
      },
      {
        match: "^(DESede|TripleDES)",
        algorithm: "3DES",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "Triple-DES \u2014 withdrawn by NIST."
      },
      {
        match: "^DES",
        algorithm: "DES",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "DES \u2014 brute-forceable today."
      },
      {
        match: "^(RC4|ARCFOUR|RC2|Blowfish)",
        algorithm: "RC4/Blowfish",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "Legacy cipher \u2014 weak against classical attacks."
      },
      {
        match: "^AES_128",
        algorithm: "AES-128",
        primitive: "symmetric",
        quantum_risk: "LOW",
        fix: "symmetric-aes256",
        message: "AES-128 \u2014 AES-256 recommended for long-lived data."
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    message: "Cipher.",
    confidence: "high"
  },
  {
    id: "java-messagedigest-weak",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)MessageDigest\\.getInstance$",
    args: {
      "0": "^(MD2|MD5|SHA|SHA1|SHA-1)$"
    },
    variants: [
      {
        match: "^MD",
        algorithm: "MD5"
      },
      {
        match: "^SHA",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "MD5",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "MD5/SHA-1 digest \u2014 collision attacks exist today.",
    confidence: "high"
  },
  {
    id: "java-keyfactory",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)KeyFactory\\.getInstance$",
    variants: [
      {
        match: "^RSA$",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "^(EC|ECDSA)$",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "^DSA$",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: "^(DH|DiffieHellman|X25519|XDH)$",
        algorithm: "DH/X25519",
        primitive: "key-agreement"
      },
      {
        match: "^(Ed25519|EdDSA)$",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "java-mlkem",
    message: "Classical key material loaded via KeyFactory."
  },
  {
    id: "java-sslcontext-legacy",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)SSLContext\\.getInstance$",
    args: {
      "0": "^(SSL|SSLv3|TLSv1|TLSv1\\.1)$"
    },
    variants: [
      {
        match: "^TLSv1\\.1$",
        algorithm: "TLS 1.1",
        parameter: "1.1"
      },
      {
        match: "^TLSv1$",
        algorithm: "TLS 1.0",
        parameter: "1.0"
      },
      {
        match: "^SSL",
        algorithm: "SSLv3",
        parameter: "3.0"
      }
    ],
    algorithm: "TLS 1.0",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "SSLContext pinned to a deprecated protocol.",
    confidence: "high"
  },
  {
    id: "java-tls-named-groups",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "(^|\\.)System\\.setProperty$",
    args: {
      "0": "^jdk\\.tls\\.namedGroups$"
    },
    variant_from: "arg1",
    variants: [
      {
        match: "mlkem",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-library-pq",
    message: "jdk.tls.namedGroups without a post-quantum hybrid group.",
    confidence: "high"
  },
  {
    id: "java-bouncycastle",
    language: [
      "java"
    ],
    kind: "treesitter",
    callee: "^new (RSAKeyPairGenerator|ECKeyPairGenerator|DSAKeyPairGenerator|DHKeyPairGenerator|Ed25519KeyPairGenerator|X25519KeyPairGenerator|RSAEngine|ECDSASigner|DSASigner|Ed25519Signer|ECDHBasicAgreement|DHBasicAgreement|X25519Agreement|ECIESKeyEncapsulation|RSADigestSigner|PSSSigner|MD5Digest|SHA1Digest|DESEngine|DESedeEngine|RC4Engine|BlowfishEngine|MLKEMKeyPairGenerator|MLDSASigner)$",
    variant_from: "callee",
    variants: [
      {
        match: "MLKEM|MLDSA",
        algorithm: "ML-KEM/ML-DSA",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum BouncyCastle primitive."
      },
      {
        match: "RSA|PSS",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "ECDH|X25519|DH",
        algorithm: "ECDH/DH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "EC|ECIES",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "DSA",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: "Ed25519",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: "MD5",
        algorithm: "MD5",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "SHA1",
        algorithm: "SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "DESede",
        algorithm: "3DES",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers"
      },
      {
        match: "DES|RC4|Blowfish",
        algorithm: "DES/RC4",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    fix: "java-mlkem",
    message: "BouncyCastle classical primitive.",
    confidence: "high"
  },
  {
    id: "js-generate-keypair",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)generateKeyPair(Sync)?$",
    variant_from: "arg0",
    key_size: "prop:modulusLength|prop:divisorLength|prop:primeLength",
    parameter: "prop:namedCurve",
    variants: [
      {
        match: "^rsa$",
        algorithm: "RSA",
        primitive: "pke",
        fix: "node-crypto-migration"
      },
      {
        match: "^rsa-pss$",
        algorithm: "RSA-PSS",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^dsa$",
        algorithm: "DSA",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^ec$",
        algorithm: "ECC",
        primitive: "signature",
        fix: "node-crypto-migration"
      },
      {
        match: "^ed(25519|448)$",
        algorithm: "Ed25519",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^x25519$",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^x448$",
        algorithm: "X448",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^dh$",
        algorithm: "DH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^ml-kem-512$",
        algorithm: "ML-KEM-512",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-KEM key generation."
      },
      {
        match: "^ml-kem-768$",
        algorithm: "ML-KEM-768",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-KEM key generation."
      },
      {
        match: "^ml-kem-1024$",
        algorithm: "ML-KEM-1024",
        primitive: "kem",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-KEM key generation."
      },
      {
        match: "^ml-dsa-(44|65|87)$",
        algorithm: "ML-DSA",
        primitive: "signature",
        quantum_risk: "NONE",
        fix: "pq-library-present",
        message: "Post-quantum ML-DSA key generation."
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    message: "Key pair generation with a classical algorithm (node:crypto) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "js-jose-generate-keypair",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)generateKeyPair$",
    args: {
      "0": "^((RS|PS|ES)\\d{3}|EdDSA|ECDH-ES.*|RSA-OAEP.*)$"
    },
    variants: [
      {
        match: "^PS",
        algorithm: "RSA-PSS",
        primitive: "signature"
      },
      {
        match: "^RS",
        algorithm: "RSA",
        primitive: "signature"
      },
      {
        match: "^ES",
        algorithm: "ECDSA",
        primitive: "signature"
      },
      {
        match: "^EdDSA",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: "^ECDH",
        algorithm: "ECDH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^RSA-OAEP",
        algorithm: "RSA",
        primitive: "pke",
        fix: "rsa-to-mlkem"
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "jwt-crypto-agility",
    message: "JOSE key generation with a classical algorithm.",
    confidence: "high"
  },
  {
    id: "js-webcrypto-algorithm",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    query: `((object (pair key: (property_identifier) @k value: (string) @alg)) @match
  (#eq? @k "name")
  (#match? @alg "^['\\"](RSA-OAEP|RSASSA-PKCS1-v1_5|RSA-PSS|ECDSA|ECDH|Ed25519|X25519|Ed448|X448)['\\"]$"))
`,
    variant_from: "capture:alg",
    key_size: "regex:modulusLength\\s*:\\s*(\\d+)",
    variants: [
      {
        match: "^RSA-OAEP$",
        algorithm: "RSA",
        primitive: "pke",
        fix: "rsa-to-mlkem"
      },
      {
        match: "^RSASSA-PKCS1-v1_5$",
        algorithm: "RSA",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^RSA-PSS$",
        algorithm: "RSA-PSS",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^ECDSA$",
        algorithm: "ECDSA",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^ECDH$",
        algorithm: "ECDH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^(Ed25519|Ed448)$",
        algorithm: "Ed25519",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^(X25519|X448)$",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    message: "WebCrypto algorithm that is not quantum-safe.",
    confidence: "high"
  },
  {
    id: "js-create-sign",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(createSign|createVerify)$",
    variants: [
      {
        match: "rsa",
        algorithm: "RSA"
      },
      {
        match: "ecdsa",
        algorithm: "ECDSA"
      },
      {
        match: "dsa",
        algorithm: "DSA"
      },
      {
        match: "^(sha|SHA)-?(1|224|256|384|512)$",
        algorithm: "RSA/ECDSA",
        confidence: "medium",
        message: "Signature with a key-dependent classical algorithm (RSA or ECDSA) \u2014 not quantum-safe."
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "Digital signature with a classical algorithm (node:crypto).",
    confidence: "high"
  },
  {
    id: "js-crypto-sign",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "^crypto\\.(sign|verify)$",
    algorithm: "RSA/ECDSA/EdDSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    confidence: "low",
    fix: "signatures-to-mldsa",
    message: "crypto.sign/verify \u2014 the algorithm depends on the key; classical unless it is an ML-DSA key."
  },
  {
    id: "js-create-ecdh",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)createECDH$",
    parameter: "arg0",
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "ecdh-to-hybrid",
    message: "ECDH key agreement \u2014 exposed to harvest-now-decrypt-later.",
    confidence: "high"
  },
  {
    id: "js-create-dh",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(createDiffieHellman|getDiffieHellman|createDiffieHellmanGroup)$",
    key_size: "arg0",
    algorithm: "DH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "ecdh-to-hybrid",
    message: "Diffie-Hellman key agreement \u2014 exposed to harvest-now-decrypt-later.",
    confidence: "high"
  },
  {
    id: "js-rsa-encrypt",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "^(crypto\\.)?(publicEncrypt|privateDecrypt)$",
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    fix: "rsa-to-mlkem",
    message: "RSA encryption (node:crypto publicEncrypt/privateDecrypt) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "js-weak-hash",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)createHash$",
    args: {
      "0": "^(md5|md4|sha1|sha-1)$"
    },
    variants: [
      {
        match: "^md[45]$",
        algorithm: "MD5"
      },
      {
        match: "^sha-?1$",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "MD5",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "MD5/SHA-1 hash \u2014 collision attacks exist today.",
    confidence: "high"
  },
  {
    id: "js-cipher",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(createCipheriv|createDecipheriv|createCipher|createDecipher)$",
    variants: [
      {
        match: "^(des-ede3|des3|des-ede)",
        algorithm: "3DES",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "Triple-DES \u2014 withdrawn by NIST."
      },
      {
        match: "^des",
        algorithm: "DES",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "DES \u2014 56-bit keys are brute-forceable today."
      },
      {
        match: "^(rc4|rc2|bf|blowfish|cast)",
        algorithm: "RC4/Blowfish",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers",
        message: "Legacy cipher \u2014 already weak against classical attacks."
      },
      {
        match: "^aes-?128",
        algorithm: "AES-128",
        quantum_risk: "LOW",
        fix: "symmetric-aes256",
        message: "AES-128 \u2014 Grover's algorithm halves its effective strength; AES-256 recommended for long-lived data."
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "AES-128",
    primitive: "symmetric",
    quantum_risk: "LOW",
    message: "Symmetric cipher.",
    confidence: "high"
  },
  {
    id: "js-tls-ecdh-curve",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    query: '((pair key: (property_identifier) @k value: (string) @v) @match\n  (#eq? @k "ecdhCurve"))\n',
    variant_from: "capture:v",
    variants: [
      {
        match: "mlkem|^auto$",
        skip: true
      },
      {
        match: "."
      }
    ],
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "node-tls-pq",
    message: "TLS ecdhCurve list without a post-quantum hybrid group.",
    confidence: "high"
  },
  {
    id: "js-tls-version",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    query: '((pair key: (property_identifier) @k value: (string) @v) @match\n  (#match? @k "^(minVersion|maxVersion|secureProtocol)$"))\n',
    variant_from: "match",
    variants: [
      {
        match: `minVersion\\s*:\\s*['"]TLSv1(\\.1)?['"]`,
        algorithm: "TLS 1.0/1.1",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "tls-legacy-protocols",
        message: "TLS minimum version allows deprecated TLS 1.0/1.1."
      },
      {
        match: `secureProtocol\\s*:\\s*['"](TLSv1|TLSv1_1|SSLv3)_`,
        algorithm: "TLS 1.0/1.1",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "tls-legacy-protocols",
        message: "Deprecated TLS protocol pinned."
      },
      {
        match: `maxVersion\\s*:\\s*['"]TLSv1(\\.[12])?['"]`,
        algorithm: "TLS \u2264 1.2",
        quantum_risk: "HIGH",
        fix: "node-tls-pq",
        message: "TLS maximum version below 1.3 \u2014 post-quantum key exchange impossible."
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "TLS",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    message: "TLS version setting.",
    confidence: "high"
  },
  {
    id: "js-node-forge",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(pki\\.rsa\\.generateKeyPair|pki\\.ed25519\\.generateKeyPair|md\\.(md5|sha1)\\.create|ed25519\\.generateKeyPair)$",
    variant_from: "callee",
    key_size: "prop:bits|arg0",
    variants: [
      {
        match: "rsa\\.generateKeyPair",
        algorithm: "RSA",
        primitive: "pke",
        quantum_risk: "HIGH",
        fix: "node-crypto-migration"
      },
      {
        match: "ed25519",
        algorithm: "Ed25519",
        primitive: "signature",
        quantum_risk: "HIGH",
        fix: "signatures-to-mldsa"
      },
      {
        match: "md5",
        algorithm: "MD5",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "sha1",
        algorithm: "SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    message: "node-forge classical primitive.",
    confidence: "high"
  },
  {
    id: "js-jsrsasign",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(KEYUTIL\\.generateKeypair|JWS\\.sign)$|^new (\\w+\\.)*Signature$",
    variant_from: "arg0|prop:alg",
    key_size: "arg1",
    variants: [
      {
        match: "andMGF1|^PS\\d",
        algorithm: "RSA-PSS",
        primitive: "signature"
      },
      {
        match: "^RSA$|withRSA|^RS\\d",
        algorithm: "RSA",
        primitive: "signature"
      },
      {
        match: "^EC$|withECDSA|^ES\\d",
        algorithm: "ECDSA",
        primitive: "signature"
      },
      {
        match: "withDSA",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "jsrsasign classical signature.",
    confidence: "high"
  },
  {
    id: "js-elliptic",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "^new (\\w+\\.)*(ec|EC|eddsa|EdDSA)$",
    args: {
      "0": "^(secp256k1|p192|p224|p256|p384|p521|curve25519|ed25519)$"
    },
    variant_from: "arg0",
    parameter: "arg0",
    variants: [
      {
        match: "ed25519",
        algorithm: "Ed25519"
      },
      {
        match: ".",
        algorithm: "ECC"
      }
    ],
    algorithm: "ECC",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "node-crypto-migration",
    message: "Elliptic-curve cryptography (elliptic) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "js-tweetnacl",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(nacl|tweetnacl)\\.(box(\\.keyPair(\\.fromSecretKey)?|\\.before)?|sign(\\.keyPair(\\.fromSeed|\\.fromSecretKey)?|\\.detached)?|scalarMult)$",
    variant_from: "callee",
    variants: [
      {
        match: "\\.(box|scalarMult)",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "\\.sign",
        algorithm: "Ed25519",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      }
    ],
    algorithm: "X25519",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    message: "TweetNaCl public-key primitive (X25519 / Ed25519) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "js-jsonwebtoken",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(jwt|jsonwebtoken|JWT)\\.(sign|verify)$|(^|\\.)setProtectedHeader$",
    variant_from: "prop:algorithm|prop:algorithms|prop:alg",
    variants: [
      {
        match: "^PS\\d{3}$",
        algorithm: "RSA-PSS"
      },
      {
        match: "^RS\\d{3}$",
        algorithm: "RSA"
      },
      {
        match: "^ES\\d{3}K?$",
        algorithm: "ECDSA"
      },
      {
        match: "^EdDSA$",
        algorithm: "Ed25519"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "jwt-crypto-agility",
    message: "JWT signed/verified with a classical public-key algorithm \u2014 plan for crypto-agility.",
    confidence: "high"
  },
  {
    id: "js-node-rsa",
    language: [
      "javascript",
      "typescript",
      "tsx"
    ],
    kind: "treesitter",
    callee: "^new (NodeRSA|RSAKey)$",
    key_size: "prop:b|arg0",
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "node-crypto-migration",
    message: "RSA via node-rsa \u2014 not quantum-safe."
  },
  {
    id: "manifest-crypto-libraries",
    kind: "manifest",
    algorithm: "library",
    primitive: "pke",
    quantum_risk: "NONE",
    confidence: "low",
    fix: "library-pqc-status",
    message: "Cryptography library dependency.",
    libraries: [
      {
        name: "node-forge",
        ecosystem: "npm",
        algorithm: "RSA/ECC (node-forge)",
        primitive: "pke",
        quantum_risk: "HIGH",
        message: "node-forge {version}: RSA/Ed25519 toolkit with no post-quantum algorithms.",
        fix: "node-crypto-migration"
      },
      {
        name: "jsrsasign",
        ecosystem: "npm",
        algorithm: "RSA/ECDSA (jsrsasign)",
        primitive: "signature",
        quantum_risk: "HIGH",
        message: "jsrsasign {version}: classical RSA/ECDSA signatures only.",
        fix: "signatures-to-mldsa"
      },
      {
        name: "elliptic",
        ecosystem: "npm",
        algorithm: "ECC (elliptic)",
        primitive: "signature",
        quantum_risk: "HIGH",
        message: "elliptic {version}: elliptic-curve only library.",
        fix: "node-crypto-migration"
      },
      {
        name: "tweetnacl|tweetnacl-util|libsodium-wrappers",
        ecosystem: "npm",
        algorithm: "X25519/Ed25519",
        primitive: "key-agreement",
        quantum_risk: "HIGH",
        message: "{name} {version}: X25519/Ed25519 only.",
        fix: "ecdh-to-hybrid"
      },
      {
        name: "node-rsa",
        ecosystem: "npm",
        algorithm: "RSA (node-rsa)",
        primitive: "pke",
        quantum_risk: "HIGH",
        confidence: "medium",
        message: "node-rsa {version}: RSA only.",
        fix: "node-crypto-migration"
      },
      {
        name: "crypto-js",
        ecosystem: "npm",
        algorithm: "crypto-js (MD5/SHA-1/DES available)",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        message: "crypto-js {version}: discontinued; exposes MD5, SHA-1, DES and RC4.",
        fix: "deprecated-library"
      },
      {
        name: "@noble/curves|secp256k1",
        ecosystem: "npm",
        algorithm: "ECC (noble/secp256k1)",
        primitive: "signature",
        quantum_risk: "HIGH",
        message: "{name} {version}: elliptic-curve cryptography.",
        fix: "node-crypto-migration"
      },
      {
        name: "jsonwebtoken|jose|jwk-to-pem|express-jwt|passport-jwt",
        ecosystem: "npm",
        algorithm: "JWT/JOSE",
        primitive: "signature",
        quantum_risk: "NONE",
        message: "{name} {version}: JWT/JOSE library \u2014 check which algorithms you use; ML-DSA support is still emerging.",
        fix: "jwt-crypto-agility"
      },
      {
        name: "@noble/post-quantum|mlkem|crystals-kyber-js|@openpgp/pqc",
        ecosystem: "npm",
        algorithm: "ML-KEM/ML-DSA",
        primitive: "kem",
        quantum_risk: "NONE",
        message: "{name} {version}: post-quantum library present.",
        fix: "pq-library-present"
      },
      {
        name: "node",
        ecosystem: "npm",
        version_below: "22.20",
        algorithm: "Node.js < 22.20 (engines)",
        primitive: "key-agreement",
        quantum_risk: "HIGH",
        message: 'engines.node "{version}" allows Node.js versions without OpenSSL 3.5 (no X25519MLKEM768).',
        fix: "node-tls-pq"
      },
      {
        name: "cryptography",
        ecosystem: "pypi",
        version_below: "48",
        algorithm: "pyca/cryptography < 48",
        primitive: "pke",
        quantum_risk: "NONE",
        message: "cryptography {version}: ML-KEM/ML-DSA need version 48 or later.",
        fix: "python-pqc"
      },
      {
        name: "pycrypto",
        ecosystem: "pypi",
        algorithm: "PyCrypto (unmaintained)",
        primitive: "pke",
        quantum_risk: "CLASSICAL_BROKEN",
        confidence: "high",
        message: "pycrypto {version}: unmaintained since 2013.",
        fix: "deprecated-library"
      },
      {
        name: "pycryptodome|pycryptodomex",
        ecosystem: "pypi",
        algorithm: "PyCryptodome",
        primitive: "pke",
        quantum_risk: "NONE",
        message: "{name} {version}: no ML-KEM/ML-DSA; classical RSA/ECC/DSA APIs.",
        fix: "python-pqc"
      },
      {
        name: "rsa",
        ecosystem: "pypi",
        algorithm: "RSA (python-rsa)",
        primitive: "pke",
        quantum_risk: "HIGH",
        confidence: "medium",
        message: "rsa {version}: pure-Python RSA library.",
        fix: "python-pqc"
      },
      {
        name: "ecdsa",
        ecosystem: "pypi",
        algorithm: "ECDSA (python-ecdsa)",
        primitive: "signature",
        quantum_risk: "HIGH",
        confidence: "medium",
        message: "ecdsa {version}: pure-Python ECDSA library.",
        fix: "python-pqc"
      },
      {
        name: "paramiko",
        ecosystem: "pypi",
        algorithm: "SSH (paramiko)",
        primitive: "key-agreement",
        quantum_risk: "NONE",
        message: "paramiko {version}: check its key-exchange list for post-quantum hybrids.",
        fix: "ssh-keys"
      },
      {
        name: "pyjwt|python-jose|jwcrypto|authlib",
        ecosystem: "pypi",
        algorithm: "JWT/JOSE",
        primitive: "signature",
        quantum_risk: "NONE",
        message: "{name} {version}: JWT/JOSE library \u2014 keep the algorithm configurable.",
        fix: "jwt-crypto-agility"
      },
      {
        name: "liboqs-python|oqs|pqcrypto|kyber-py|dilithium-py",
        ecosystem: "pypi",
        algorithm: "ML-KEM/ML-DSA",
        primitive: "kem",
        quantum_risk: "NONE",
        message: "{name} {version}: post-quantum library present.",
        fix: "pq-library-present"
      },
      {
        name: "org\\.bouncycastle:bcprov-[\\w.-]+",
        ecosystem: "maven",
        version_below: "1.79",
        algorithm: "BouncyCastle < 1.79",
        primitive: "pke",
        quantum_risk: "NONE",
        message: "BouncyCastle {version}: ML-KEM/ML-DSA/SLH-DSA need 1.79 or later.",
        fix: "java-mlkem"
      },
      {
        name: "io\\.jsonwebtoken:jjwt[\\w-]*|com\\.nimbusds:nimbus-jose-jwt|com\\.auth0:java-jwt",
        ecosystem: "maven",
        algorithm: "JWT/JOSE",
        primitive: "signature",
        quantum_risk: "NONE",
        message: "{name} {version}: JWT/JOSE library \u2014 keep the algorithm configurable.",
        fix: "jwt-crypto-agility"
      },
      {
        name: "go",
        ecosystem: "go",
        version_below: "1.24",
        algorithm: "Go < 1.24",
        primitive: "key-agreement",
        quantum_risk: "HIGH",
        confidence: "medium",
        message: "go {version}: crypto/tls offers X25519MLKEM768 by default only from Go 1.24.",
        fix: "go-tls-pq"
      },
      {
        name: "github\\.com/cloudflare/circl",
        ecosystem: "go",
        algorithm: "ML-KEM/ML-DSA (CIRCL)",
        primitive: "kem",
        quantum_risk: "NONE",
        message: "CIRCL {version}: post-quantum library present.",
        fix: "pq-library-present"
      },
      {
        name: "github\\.com/golang-jwt/jwt(/v\\d+)?|github\\.com/go-jose/go-jose(/v\\d+)?|github\\.com/lestrrat-go/jwx(/v\\d+)?",
        ecosystem: "go",
        algorithm: "JWT/JOSE",
        primitive: "signature",
        quantum_risk: "NONE",
        message: "{name} {version}: JWT/JOSE library \u2014 keep the algorithm configurable.",
        fix: "jwt-crypto-agility"
      }
    ]
  },
  {
    id: "jvm-regex-getinstance",
    kind: "regex",
    files: [
      "*.kt",
      "*.kts",
      "*.scala",
      "*.groovy"
    ],
    pattern: '\\b(?<cls>KeyPairGenerator|KeyAgreement|Signature|Cipher|MessageDigest)\\.getInstance\\(\\s*"(?<alg>[^"]+)"',
    variant_from: "match",
    variants: [
      {
        match: "ML-(KEM|DSA)",
        skip: true
      },
      {
        match: 'KeyPairGenerator.*"RSA"',
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: 'KeyPairGenerator.*"(EC|ECDSA)"',
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: 'KeyPairGenerator.*"(DH|XDH|X25519)"',
        algorithm: "DH/X25519",
        primitive: "key-agreement"
      },
      {
        match: 'KeyPairGenerator.*"(DSA|Ed25519|EdDSA)"',
        algorithm: "DSA/EdDSA",
        primitive: "signature"
      },
      {
        match: "KeyAgreement",
        algorithm: "ECDH/DH",
        primitive: "key-agreement"
      },
      {
        match: 'Signature.*"(MD5|SHA1|SHA-1)with',
        algorithm: "SHA-1/MD5 signature",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "Signature.*(RSA|ECDSA|DSA|Ed25519|EdDSA)",
        algorithm: "RSA/ECDSA",
        primitive: "signature"
      },
      {
        match: 'Cipher.*"RSA',
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: 'Cipher.*"(DES|DESede|RC4|Blowfish)',
        algorithm: "DES/RC4",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers"
      },
      {
        match: 'MessageDigest.*"(MD5|SHA-?1|SHA)"',
        algorithm: "MD5/SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "java-mlkem",
    message: "JCA call with a classical algorithm (Kotlin/Scala/Groovy)."
  },
  {
    id: "c-openssl-classical",
    kind: "regex",
    files: [
      "*.c",
      "*.h",
      "*.cc",
      "*.cpp",
      "*.cxx",
      "*.hpp"
    ],
    pattern: "\\b(?<alg>RSA_generate_key(?:_ex)?|EVP_PKEY_RSA\\b|EC_KEY_new_by_curve_name|EVP_PKEY_EC\\b|DH_generate_key|EVP_PKEY_DH\\b|EVP_PKEY_ED25519|EVP_PKEY_X25519|ECDSA_sign|RSA_public_encrypt|MD5_Init|MD5\\s*\\(|SHA1_Init|SHA1\\s*\\(|EVP_md5|EVP_sha1|DES_ecb_encrypt|DES_set_key|EVP_des_\\w+|EVP_rc4)",
    variants: [
      {
        match: "RSA",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "EC_KEY|EVP_PKEY_EC|ECDSA",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "DH",
        algorithm: "DH",
        primitive: "key-agreement"
      },
      {
        match: "ED25519",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: "X25519",
        algorithm: "X25519",
        primitive: "key-agreement"
      },
      {
        match: "MD5|md5",
        algorithm: "MD5",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "SHA1|sha1",
        algorithm: "SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "DES|des_|rc4",
        algorithm: "DES/RC4",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "c-openssl-pq",
    message: "OpenSSL classical primitive (C/C++)."
  },
  {
    id: "csharp-classical",
    kind: "regex",
    files: [
      "*.cs"
    ],
    pattern: "\\b(?<alg>RSA\\.Create|RSACryptoServiceProvider|RSACng|ECDsa\\.Create|ECDsaCng|ECDiffieHellman\\.Create|DSA\\.Create|DSACryptoServiceProvider|MD5\\.Create|MD5CryptoServiceProvider|SHA1\\.Create|SHA1Managed|SHA1CryptoServiceProvider|TripleDES\\.Create|DES\\.Create|RC2\\.Create)\\b",
    variants: [
      {
        match: "^RSA",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "^ECDsa",
        algorithm: "ECDSA",
        primitive: "signature"
      },
      {
        match: "^ECDiffieHellman",
        algorithm: "ECDH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^DSA",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: "^MD5",
        algorithm: "MD5",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "^SHA1",
        algorithm: "SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "^(TripleDES|DES|RC2)",
        algorithm: "DES/3DES/RC2",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "dotnet-pqc",
    message: ".NET classical cryptography class."
  },
  {
    id: "rust-classical-crates",
    kind: "regex",
    files: [
      "*.rs"
    ],
    pattern: "^\\s*use\\s+(?<alg>rsa|p256|p384|p521|k256|ecdsa|ed25519_dalek|x25519_dalek|md5|sha1|des)::",
    flags: "im",
    variants: [
      {
        match: "^rsa$",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "^(p256|p384|p521|k256|ecdsa)$",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "^ed25519_dalek$",
        algorithm: "Ed25519",
        primitive: "signature"
      },
      {
        match: "^x25519_dalek$",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "^md5$",
        algorithm: "MD5",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "^sha1$",
        algorithm: "SHA-1",
        primitive: "hash",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "hash-md5-sha1"
      },
      {
        match: "^des$",
        algorithm: "DES",
        primitive: "symmetric",
        quantum_risk: "CLASSICAL_BROKEN",
        fix: "legacy-ciphers"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "signatures-to-mldsa",
    message: "Rust crate providing classical public-key cryptography."
  },
  {
    id: "php-classical",
    kind: "regex",
    files: [
      "*.php"
    ],
    pattern: "\\b(?<alg>OPENSSL_KEYTYPE_RSA|OPENSSL_KEYTYPE_EC|OPENSSL_KEYTYPE_DH|OPENSSL_KEYTYPE_DSA|sodium_crypto_box_keypair|sodium_crypto_sign_keypair|openssl_public_encrypt)\\b",
    variants: [
      {
        match: "RSA|public_encrypt",
        algorithm: "RSA",
        primitive: "pke"
      },
      {
        match: "_EC$",
        algorithm: "ECC",
        primitive: "signature"
      },
      {
        match: "_DH$",
        algorithm: "DH",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "_DSA$",
        algorithm: "DSA",
        primitive: "signature"
      },
      {
        match: "box_keypair",
        algorithm: "X25519",
        primitive: "key-agreement",
        fix: "ecdh-to-hybrid"
      },
      {
        match: "sign_keypair",
        algorithm: "Ed25519",
        primitive: "signature"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    fix: "signatures-to-mldsa",
    message: "PHP classical public-key primitive."
  },
  {
    id: "py-cryptography-rsa-generate",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)rsa\\.generate_private_key$",
    key_size: "kwarg:key_size|arg1",
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    fix: "py-rsa-to-mlkem",
    message: "RSA key generation (pyca/cryptography) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-cryptography-rsa-padding",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)padding\\.(OAEP|PKCS1v15|PSS)$",
    variant_from: "callee",
    variants: [
      {
        match: "OAEP|PKCS1v15",
        algorithm: "RSA",
        primitive: "pke",
        message: "RSA encryption padding in use \u2014 RSA is not quantum-safe.",
        fix: "py-rsa-to-mlkem"
      },
      {
        match: "PSS",
        algorithm: "RSA-PSS",
        primitive: "signature",
        message: "RSA-PSS signature padding in use \u2014 not quantum-safe.",
        fix: "signatures-to-mldsa"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    message: "RSA operation (pyca/cryptography)."
  },
  {
    id: "py-cryptography-ec-generate",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)ec\\.generate_private_key$",
    parameter: "regex:(SECP\\d+[RK]1|BrainpoolP\\d+R1|SECT\\d+[RK]1)",
    algorithm: "ECC",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "Elliptic-curve key generation (pyca/cryptography) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-cryptography-ecdh",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "\\.exchange$",
    args: {
      "0": "(^|\\.)ECDH\\(\\)$"
    },
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "ecdh-to-hybrid",
    message: "ECDH key agreement \u2014 exposed to harvest-now-decrypt-later.",
    confidence: "high"
  },
  {
    id: "py-cryptography-ecdsa",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)ec\\.ECDSA$",
    algorithm: "ECDSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "ECDSA signature (pyca/cryptography) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-cryptography-dh",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)dh\\.generate_parameters$",
    key_size: "kwarg:key_size|arg1",
    algorithm: "DH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "ecdh-to-hybrid",
    message: "Finite-field Diffie-Hellman \u2014 exposed to harvest-now-decrypt-later.",
    confidence: "high"
  },
  {
    id: "py-cryptography-dsa",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)dsa\\.generate_private_key$",
    key_size: "kwarg:key_size|arg0",
    algorithm: "DSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "DSA key generation \u2014 deprecated and not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-cryptography-x25519",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(X25519|X448)PrivateKey\\.generate$",
    variant_from: "callee",
    variants: [
      {
        match: "X448",
        algorithm: "X448"
      },
      {
        match: "X25519",
        algorithm: "X25519"
      }
    ],
    algorithm: "X25519",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    fix: "ecdh-to-hybrid",
    message: "X25519/X448 key agreement \u2014 exposed to harvest-now-decrypt-later without an ML-KEM hybrid.",
    confidence: "high"
  },
  {
    id: "py-cryptography-ed25519",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(Ed25519|Ed448)PrivateKey\\.generate$",
    variant_from: "callee",
    variants: [
      {
        match: "Ed448",
        algorithm: "Ed448"
      },
      {
        match: "Ed25519",
        algorithm: "Ed25519"
      }
    ],
    algorithm: "Ed25519",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "signatures-to-mldsa",
    message: "EdDSA key generation \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-cryptography-weak-hash",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)hashes\\.(MD5|SHA1)$",
    variant_from: "callee",
    variants: [
      {
        match: "MD5$",
        algorithm: "MD5"
      },
      {
        match: "SHA1$",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "MD5",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "MD5/SHA-1 hash \u2014 collision attacks exist today.",
    confidence: "high"
  },
  {
    id: "py-cryptography-pq",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "(^|\\.)(MLKEM\\d+|MLDSA\\d+)PrivateKey\\.generate$",
    variant_from: "callee",
    variants: [
      {
        match: "MLKEM512",
        algorithm: "ML-KEM-512",
        primitive: "kem"
      },
      {
        match: "MLKEM768",
        algorithm: "ML-KEM-768",
        primitive: "kem"
      },
      {
        match: "MLKEM1024",
        algorithm: "ML-KEM-1024",
        primitive: "kem"
      },
      {
        match: "MLDSA44",
        algorithm: "ML-DSA-44"
      },
      {
        match: "MLDSA65",
        algorithm: "ML-DSA-65"
      },
      {
        match: "MLDSA87",
        algorithm: "ML-DSA-87"
      }
    ],
    algorithm: "ML-DSA",
    primitive: "signature",
    quantum_risk: "NONE",
    fix: "pq-library-present",
    message: "Post-quantum algorithm in use (pyca/cryptography).",
    confidence: "high"
  },
  {
    id: "py-hashlib-weak",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^hashlib\\.(md5|sha1)$",
    variant_from: "callee",
    variants: [
      {
        match: "md5$",
        algorithm: "MD5"
      },
      {
        match: "sha1$",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "MD5",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "MD5/SHA-1 via hashlib \u2014 collision attacks exist today.",
    confidence: "high"
  },
  {
    id: "py-hashlib-new-weak",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^hashlib\\.new$",
    args: {
      "0": "^(md5|sha1|sha-1|md4)$"
    },
    variants: [
      {
        match: "^md[45]$",
        algorithm: "MD5"
      },
      {
        match: "^sha-?1$",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "MD5",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "Weak hash via hashlib.new \u2014 collision attacks exist today.",
    confidence: "high"
  },
  {
    id: "py-pycryptodome-pubkey",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^(Crypto\\.PublicKey\\.|Cryptodome\\.PublicKey\\.)?(RSA|ECC|DSA)\\.(generate|construct|import_key|importKey)$",
    variant_from: "callee",
    key_size: "kwarg:bits|arg0",
    parameter: "kwarg:curve",
    variants: [
      {
        match: "(^|\\.)RSA\\.",
        algorithm: "RSA",
        primitive: "pke",
        fix: "python-pqc"
      },
      {
        match: "(^|\\.)ECC\\.",
        algorithm: "ECC",
        primitive: "signature",
        fix: "python-pqc"
      },
      {
        match: "(^|\\.)DSA\\.",
        algorithm: "DSA",
        primitive: "signature",
        fix: "python-pqc"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    message: "Public-key operation with PyCryptodome \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-pycryptodome-schemes",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^(PKCS1_OAEP|PKCS1_v1_5|pkcs1_15|pss|DSS)\\.new$",
    variant_from: "callee",
    variants: [
      {
        match: "^PKCS1_(OAEP|v1_5)",
        algorithm: "RSA",
        primitive: "pke",
        fix: "rsa-to-mlkem"
      },
      {
        match: "^(pkcs1_15|pss)",
        algorithm: "RSA",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      },
      {
        match: "^DSS",
        algorithm: "ECDSA/DSA",
        primitive: "signature",
        fix: "signatures-to-mldsa"
      }
    ],
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    confidence: "medium",
    message: "RSA/DSA scheme (PyCryptodome) \u2014 not quantum-safe."
  },
  {
    id: "py-pycryptodome-legacy-cipher",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^(DES|DES3|ARC4|ARC2|Blowfish|CAST)\\.new$",
    variant_from: "callee",
    variants: [
      {
        match: "^DES3",
        algorithm: "3DES"
      },
      {
        match: "^DES",
        algorithm: "DES"
      },
      {
        match: "^ARC4",
        algorithm: "RC4"
      },
      {
        match: "^ARC2",
        algorithm: "RC2"
      },
      {
        match: "^Blowfish",
        algorithm: "Blowfish"
      },
      {
        match: "^CAST",
        algorithm: "CAST5"
      }
    ],
    algorithm: "DES",
    primitive: "symmetric",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "legacy-ciphers",
    message: "Legacy cipher \u2014 already weak against classical attacks.",
    confidence: "high"
  },
  {
    id: "py-pycryptodome-weak-hash",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^(MD5|SHA1|SHA)\\.new$",
    variant_from: "callee",
    variants: [
      {
        match: "^MD5",
        algorithm: "MD5"
      },
      {
        match: "^SHA1?\\.",
        algorithm: "SHA-1"
      }
    ],
    algorithm: "MD5",
    primitive: "hash",
    quantum_risk: "CLASSICAL_BROKEN",
    fix: "hash-md5-sha1",
    message: "MD5/SHA-1 (PyCryptodome) \u2014 collision attacks exist today.",
    confidence: "high"
  },
  {
    id: "py-rsa-lib",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^rsa\\.newkeys$",
    key_size: "arg0",
    algorithm: "RSA",
    primitive: "pke",
    quantum_risk: "HIGH",
    fix: "python-pqc",
    message: "RSA key generation (python-rsa) \u2014 not quantum-safe.",
    confidence: "high"
  },
  {
    id: "py-ssl-legacy-protocol",
    language: [
      "python"
    ],
    kind: "treesitter",
    query: '((attribute object: (identifier) @mod attribute: (identifier) @attr) @match\n  (#eq? @mod "ssl")\n  (#match? @attr "^PROTOCOL_(TLSv1|TLSv1_1|SSLv2|SSLv3)$"))\n',
    variant_from: "capture:attr",
    variants: [
      {
        match: "TLSv1_1",
        algorithm: "TLS 1.1",
        parameter: "1.1"
      },
      {
        match: "TLSv1$",
        algorithm: "TLS 1.0",
        parameter: "1.0"
      },
      {
        match: "SSLv",
        algorithm: "SSLv3",
        parameter: "3.0"
      }
    ],
    algorithm: "TLS 1.0",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "Deprecated TLS/SSL protocol version pinned.",
    confidence: "high"
  },
  {
    id: "py-ssl-tlsversion-legacy",
    language: [
      "python"
    ],
    kind: "treesitter",
    query: '((attribute object: (attribute object: (identifier) @mod attribute: (identifier) @cls) attribute: (identifier) @attr) @match\n  (#eq? @mod "ssl") (#eq? @cls "TLSVersion")\n  (#match? @attr "^(TLSv1|TLSv1_1|SSLv3)$"))\n',
    variant_from: "capture:attr",
    variants: [
      {
        match: "TLSv1_1",
        algorithm: "TLS 1.1",
        parameter: "1.1"
      },
      {
        match: "TLSv1$",
        algorithm: "TLS 1.0",
        parameter: "1.0"
      },
      {
        match: "SSLv3",
        algorithm: "SSLv3",
        parameter: "3.0"
      }
    ],
    algorithm: "TLS 1.0",
    primitive: "key-agreement",
    quantum_risk: "CLASSICAL_BROKEN",
    asset_type: "protocol",
    fix: "tls-legacy-protocols",
    message: "Minimum/maximum TLS version set to a deprecated protocol.",
    confidence: "high"
  },
  {
    id: "py-ssl-ecdh-curve",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "\\.set_ecdh_curve$",
    parameter: "arg0",
    algorithm: "ECDH",
    primitive: "key-agreement",
    quantum_risk: "HIGH",
    asset_type: "protocol",
    fix: "tls-library-pq",
    message: "TLS key exchange pinned to one classical curve \u2014 disables the post-quantum hybrid default.",
    confidence: "high"
  },
  {
    id: "py-paramiko-keys",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^(paramiko\\.)?(RSAKey|DSSKey|ECDSAKey|Ed25519Key)\\.generate$",
    variant_from: "callee",
    key_size: "kwarg:bits|arg0",
    variants: [
      {
        match: "RSAKey",
        algorithm: "RSA"
      },
      {
        match: "DSSKey",
        algorithm: "DSA"
      },
      {
        match: "ECDSAKey",
        algorithm: "ECDSA"
      },
      {
        match: "Ed25519Key",
        algorithm: "Ed25519"
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "ssh-keys",
    message: "SSH key generation with paramiko \u2014 classical signature key.",
    confidence: "high"
  },
  {
    id: "py-jwt-algorithm",
    language: [
      "python"
    ],
    kind: "treesitter",
    callee: "^(jwt|jws|jose\\.jwt|jose\\.jws)\\.(encode|decode|sign|verify)$",
    variant_from: "kwarg:algorithm|kwarg:algorithms",
    variants: [
      {
        match: "^PS\\d{3}$",
        algorithm: "RSA-PSS"
      },
      {
        match: "^RS\\d{3}$",
        algorithm: "RSA"
      },
      {
        match: "^ES\\d{3}K?$",
        algorithm: "ECDSA"
      },
      {
        match: "^EdDSA$",
        algorithm: "Ed25519"
      },
      {
        match: ".",
        skip: true
      }
    ],
    algorithm: "RSA",
    primitive: "signature",
    quantum_risk: "HIGH",
    fix: "jwt-crypto-agility",
    message: "JWT signed/verified with a classical public-key algorithm \u2014 plan for crypto-agility.",
    confidence: "high"
  }
];

// generated/fixes.json
var fixes_default = {
  "c-openssl-pq": {
    id: "c-openssl-pq",
    title: "C/C++: use OpenSSL 3.5 EVP APIs for ML-KEM / ML-DSA",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "EC",
      "DH",
      "Ed25519",
      "X25519",
      "MD5",
      "SHA-1"
    ],
    why: "Low-level calls like `RSA_generate_key_ex`, `EC_KEY_new_by_curve_name` or `DH_generate_key` hard-wire classical algorithms, and many of these APIs are deprecated in OpenSSL 3.",
    replacement: "Use the algorithm-agnostic EVP interface. With OpenSSL \u2265 3.5, ML-KEM and ML-DSA are available by name, so the algorithm becomes a string you can configure.",
    before: {
      lang: "c",
      code: "RSA *rsa = RSA_new();\nRSA_generate_key_ex(rsa, 2048, e, NULL);"
    },
    after: {
      lang: "c",
      code: 'EVP_PKEY *kem = EVP_PKEY_Q_keygen(NULL, NULL, "ML-KEM-768");\nEVP_PKEY *sig = EVP_PKEY_Q_keygen(NULL, NULL, "ML-DSA-65");\n/* encapsulate with EVP_PKEY_encapsulate_init / EVP_PKEY_encapsulate */'
    },
    caveats: "- For TLS, OpenSSL 3.5 already offers X25519MLKEM768 by default. Don't override the groups list.",
    references: [
      "https://docs.openssl.org/3.5/man7/EVP_KEM-ML-KEM/",
      "https://docs.openssl.org/3.5/man7/EVP_SIGNATURE-ML-DSA/"
    ],
    markdown: '## Why\n\nLow-level calls like `RSA_generate_key_ex`, `EC_KEY_new_by_curve_name` or `DH_generate_key` hard-wire classical algorithms, and many of these APIs are deprecated in OpenSSL 3.\n\n## Replacement\n\nUse the algorithm-agnostic EVP interface. With OpenSSL \u2265 3.5, ML-KEM and ML-DSA are available by name, so the algorithm becomes a string you can configure.\n\n## Before\n\n```c\nRSA *rsa = RSA_new();\nRSA_generate_key_ex(rsa, 2048, e, NULL);\n```\n\n## After\n\n```c\nEVP_PKEY *kem = EVP_PKEY_Q_keygen(NULL, NULL, "ML-KEM-768");\nEVP_PKEY *sig = EVP_PKEY_Q_keygen(NULL, NULL, "ML-DSA-65");\n/* encapsulate with EVP_PKEY_encapsulate_init / EVP_PKEY_encapsulate */\n```\n\n## Caveats\n\n- For TLS, OpenSSL 3.5 already offers X25519MLKEM768 by default. Don\'t override the groups list.\n\n## References\n\n- https://docs.openssl.org/3.5/man7/EVP_KEM-ML-KEM/\n- https://docs.openssl.org/3.5/man7/EVP_SIGNATURE-ML-DSA/'
  },
  "certificate-classical": {
    id: "certificate-classical",
    title: "Certificates: classical today \u2014 inventory them and keep issuance automated",
    verified: "2026-10-21",
    appliesTo: [
      "X.509"
    ],
    why: "Every certificate in the public WebPKI is still RSA or ECDSA; public CAs and browsers do not issue or accept ML-DSA certificates yet. Private PKIs (internal mTLS, IoT, code signing) can already experiment with ML-DSA using OpenSSL 3.5 or BouncyCastle.",
    replacement: "- Keep a CBOM of certificates (this report) with expiry dates.\n- Automate issuance and renewal (ACME / your CA's API) so swapping algorithms later is a configuration change.\n- For private PKIs, pilot ML-DSA or composite certificates where both ends are under your control.\n- Replace SHA-1-signed or < 2048-bit RSA certificates now. That is a classical issue.",
    before: {
      lang: "text",
      code: "Manually issued RSA-2048 certificate, renewed by hand every year"
    },
    after: {
      lang: "text",
      code: "ACME-automated ECDSA P-256 certificate, 90-day lifetime, algorithm set in one config value"
    },
    caveats: "- Don't deploy experimental PQ certificates on public endpoints. Browsers will reject them.",
    references: [
      "https://csrc.nist.gov/pubs/fips/204/final"
    ],
    markdown: "## Why\n\nEvery certificate in the public WebPKI is still RSA or ECDSA; public CAs and browsers do not issue or accept ML-DSA certificates yet. Private PKIs (internal mTLS, IoT, code signing) can already experiment with ML-DSA using OpenSSL 3.5 or BouncyCastle.\n\n## Replacement\n\n- Keep a CBOM of certificates (this report) with expiry dates.\n- Automate issuance and renewal (ACME / your CA's API) so swapping algorithms later is a configuration change.\n- For private PKIs, pilot ML-DSA or composite certificates where both ends are under your control.\n- Replace SHA-1-signed or < 2048-bit RSA certificates now. That is a classical issue.\n\n## Before\n\n```text\nManually issued RSA-2048 certificate, renewed by hand every year\n```\n\n## After\n\n```text\nACME-automated ECDSA P-256 certificate, 90-day lifetime, algorithm set in one config value\n```\n\n## Caveats\n\n- Don't deploy experimental PQ certificates on public endpoints. Browsers will reject them.\n\n## References\n\n- https://csrc.nist.gov/pubs/fips/204/final"
  },
  "cloud-tls-policy": {
    id: "cloud-tls-policy",
    title: "Cloud load balancers: pick a post-quantum TLS policy",
    verified: "2026-10-21",
    appliesTo: [
      "TLS"
    ],
    why: "Managed load balancers terminate TLS with the policy you name. Older AWS ELB policies (e.g. `ELBSecurityPolicy-2016-08`) still allow TLS 1.0/1.1 and offer no post-quantum groups. Minimum-version settings of `1.0` / `1.1` on Azure, GCP or CloudFront keep legacy protocols alive.",
    replacement: '- **AWS ALB/NLB**: `ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09` (or the FIPS variant `ELBSecurityPolicy-TLS13-1-2-FIPS-PQ-2025-09`). These offer X25519MLKEM768, SecP256r1MLKEM768 and SecP384r1MLKEM1024.\n- **CloudFront**: `minimum_protocol_version = "TLSv1.2_2021"`.\n- **Azure / GCP**: minimum TLS version 1.2.',
    before: {
      lang: "hcl",
      code: 'resource "aws_lb_listener" "https" {\n  ssl_policy = "ELBSecurityPolicy-2016-08"\n}'
    },
    after: {
      lang: "hcl",
      code: 'resource "aws_lb_listener" "https" {\n  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"\n}'
    },
    caveats: "- Check your provider's current policy table. Names are dated and new ones appear over time.",
    references: [
      "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/describe-ssl-policies.html"
    ],
    markdown: '## Why\n\nManaged load balancers terminate TLS with the policy you name. Older AWS ELB policies (e.g. `ELBSecurityPolicy-2016-08`) still allow TLS 1.0/1.1 and offer no post-quantum groups. Minimum-version settings of `1.0` / `1.1` on Azure, GCP or CloudFront keep legacy protocols alive.\n\n## Replacement\n\n- **AWS ALB/NLB**: `ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09` (or the FIPS variant `ELBSecurityPolicy-TLS13-1-2-FIPS-PQ-2025-09`). These offer X25519MLKEM768, SecP256r1MLKEM768 and SecP384r1MLKEM1024.\n- **CloudFront**: `minimum_protocol_version = "TLSv1.2_2021"`.\n- **Azure / GCP**: minimum TLS version 1.2.\n\n## Before\n\n```hcl\nresource "aws_lb_listener" "https" {\n  ssl_policy = "ELBSecurityPolicy-2016-08"\n}\n```\n\n## After\n\n```hcl\nresource "aws_lb_listener" "https" {\n  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"\n}\n```\n\n## Caveats\n\n- Check your provider\'s current policy table. Names are dated and new ones appear over time.\n\n## References\n\n- https://docs.aws.amazon.com/elasticloadbalancing/latest/application/describe-ssl-policies.html'
  },
  "deprecated-library": {
    id: "deprecated-library",
    title: "Replace unmaintained cryptography libraries",
    verified: "2026-10-21",
    appliesTo: [
      "library"
    ],
    why: "Unmaintained libraries (e.g. PyCrypto, last released 2013; crypto-js, discontinued in 2023) receive no security fixes and will never gain post-quantum algorithms.",
    replacement: "- PyCrypto \u2192 `cryptography` (\u2265 48 for ML-KEM/ML-DSA) or PyCryptodome for legacy APIs.\n- crypto-js \u2192 the platform's WebCrypto / `node:crypto`.",
    before: {
      lang: "text",
      code: "pycrypto==2.6.1"
    },
    after: {
      lang: "text",
      code: "cryptography>=48"
    },
    caveats: "- APIs differ. Budget time for tests around every call site.",
    references: [
      "https://cryptography.io/"
    ],
    markdown: "## Why\n\nUnmaintained libraries (e.g. PyCrypto, last released 2013; crypto-js, discontinued in 2023) receive no security fixes and will never gain post-quantum algorithms.\n\n## Replacement\n\n- PyCrypto \u2192 `cryptography` (\u2265 48 for ML-KEM/ML-DSA) or PyCryptodome for legacy APIs.\n- crypto-js \u2192 the platform's WebCrypto / `node:crypto`.\n\n## Before\n\n```text\npycrypto==2.6.1\n```\n\n## After\n\n```text\ncryptography>=48\n```\n\n## Caveats\n\n- APIs differ. Budget time for tests around every call site.\n\n## References\n\n- https://cryptography.io/"
  },
  "docker-openssl": {
    id: "docker-openssl",
    title: "Move to a base image with OpenSSL \u2265 3.5 (or a PQ-capable runtime)",
    verified: "2026-10-21",
    appliesTo: [
      "OpenSSL"
    ],
    why: "TLS libraries older than OpenSSL 3.5 (Debian \u2264 12, Ubuntu \u2264 25.04, Alpine \u2264 3.21, CentOS) cannot negotiate X25519MLKEM768. The same applies to Go < 1.24 toolchains and Node.js < 22.20 / 24.5. Every service built on such an image talks classical TLS only.",
    replacement: 'Debian 13 "trixie", Ubuntu 25.10+ and Alpine 3.22+ ship OpenSSL 3.5. Node.js \u2265 24.5 and Go \u2265 1.24 bring their own PQ-capable TLS regardless of the base image.',
    before: {
      lang: "dockerfile",
      code: "FROM python:3.12-bookworm\nFROM golang:1.22"
    },
    after: {
      lang: "dockerfile",
      code: "FROM python:3.13-trixie\nFROM golang:1.27"
    },
    caveats: "- Test the upgrade: major distro jumps change other system libraries too.\n- Check with `openssl version` inside the image.",
    references: [
      "https://github.com/openssl/openssl/releases"
    ],
    markdown: '## Why\n\nTLS libraries older than OpenSSL 3.5 (Debian \u2264 12, Ubuntu \u2264 25.04, Alpine \u2264 3.21, CentOS) cannot negotiate X25519MLKEM768. The same applies to Go < 1.24 toolchains and Node.js < 22.20 / 24.5. Every service built on such an image talks classical TLS only.\n\n## Replacement\n\nDebian 13 "trixie", Ubuntu 25.10+ and Alpine 3.22+ ship OpenSSL 3.5. Node.js \u2265 24.5 and Go \u2265 1.24 bring their own PQ-capable TLS regardless of the base image.\n\n## Before\n\n```dockerfile\nFROM python:3.12-bookworm\nFROM golang:1.22\n```\n\n## After\n\n```dockerfile\nFROM python:3.13-trixie\nFROM golang:1.27\n```\n\n## Caveats\n\n- Test the upgrade: major distro jumps change other system libraries too.\n- Check with `openssl version` inside the image.\n\n## References\n\n- https://github.com/openssl/openssl/releases'
  },
  "dotnet-pqc": {
    id: "dotnet-pqc",
    title: ".NET: MLKem / MLDsa classes (.NET 10)",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDsa",
      "ECDiffieHellman",
      "DSA"
    ],
    why: "`RSA.Create()`, `ECDsa.Create()` and `ECDiffieHellman.Create()` are classical algorithms.",
    replacement: ".NET 10 added `System.Security.Cryptography.MLKem`, `MLDsa` and `SlhDsa`. They need platform support: OpenSSL \u2265 3.5 on Linux, or a Windows build with PQC in CNG. Check `MLKem.IsSupported` at runtime.",
    before: {
      lang: "csharp",
      code: "using var rsa = RSA.Create(2048);"
    },
    after: {
      lang: "csharp",
      code: "if (MLKem.IsSupported)\n{\n    using var kem = MLKem.GenerateKey(MLKemAlgorithm.MLKem768);\n}"
    },
    caveats: "- Keep the classical path behind a feature flag until all target platforms support the new classes.",
    references: [
      "https://learn.microsoft.com/dotnet/standard/security/cryptography-model"
    ],
    markdown: "## Why\n\n`RSA.Create()`, `ECDsa.Create()` and `ECDiffieHellman.Create()` are classical algorithms.\n\n## Replacement\n\n.NET 10 added `System.Security.Cryptography.MLKem`, `MLDsa` and `SlhDsa`. They need platform support: OpenSSL \u2265 3.5 on Linux, or a Windows build with PQC in CNG. Check `MLKem.IsSupported` at runtime.\n\n## Before\n\n```csharp\nusing var rsa = RSA.Create(2048);\n```\n\n## After\n\n```csharp\nif (MLKem.IsSupported)\n{\n    using var kem = MLKem.GenerateKey(MLKemAlgorithm.MLKem768);\n}\n```\n\n## Caveats\n\n- Keep the classical path behind a feature flag until all target platforms support the new classes.\n\n## References\n\n- https://learn.microsoft.com/dotnet/standard/security/cryptography-model"
  },
  "ecdh-to-hybrid": {
    id: "ecdh-to-hybrid",
    title: "Move ECDH / DH / X25519 key agreement to a hybrid with ML-KEM",
    verified: "2026-10-21",
    appliesTo: [
      "ECDH",
      "DH",
      "X25519",
      "X448"
    ],
    why: "Elliptic-curve and finite-field Diffie-Hellman are broken by Shor's algorithm. Recorded key exchanges can be replayed through a quantum computer later to recover session keys.",
    replacement: "Combine the classical exchange with ML-KEM-768 and derive the session key from both secrets (the X25519MLKEM768 construction of RFC 10024). Inside TLS this is automatic with OpenSSL \u2265 3.5, Go \u2265 1.24, Node.js \u2265 24.5 or JDK 27. For custom protocols, add an ML-KEM encapsulation next to the X25519 exchange.",
    before: {
      lang: "text",
      code: "secret = X25519(my_private, peer_public)\nkey    = HKDF(secret)"
    },
    after: {
      lang: "text",
      code: 'ss_classical = X25519(my_private, peer_public)\nss_pq, ct    = ML-KEM-768.Encapsulate(peer_mlkem_public)   # send ct\nkey          = HKDF(ss_pq || ss_classical, info="my-protocol v2")'
    },
    caveats: "- Keep the classical half during the transition: the hybrid is at least as strong as either part.\n- Version your protocol so old and new peers can negotiate.",
    references: [
      "https://www.rfc-editor.org/info/rfc10024",
      "https://csrc.nist.gov/pubs/fips/203/final"
    ],
    markdown: '## Why\n\nElliptic-curve and finite-field Diffie-Hellman are broken by Shor\'s algorithm. Recorded key exchanges can be replayed through a quantum computer later to recover session keys.\n\n## Replacement\n\nCombine the classical exchange with ML-KEM-768 and derive the session key from both secrets (the X25519MLKEM768 construction of RFC 10024). Inside TLS this is automatic with OpenSSL \u2265 3.5, Go \u2265 1.24, Node.js \u2265 24.5 or JDK 27. For custom protocols, add an ML-KEM encapsulation next to the X25519 exchange.\n\n## Before\n\n```text\nsecret = X25519(my_private, peer_public)\nkey    = HKDF(secret)\n```\n\n## After\n\n```text\nss_classical = X25519(my_private, peer_public)\nss_pq, ct    = ML-KEM-768.Encapsulate(peer_mlkem_public)   # send ct\nkey          = HKDF(ss_pq || ss_classical, info="my-protocol v2")\n```\n\n## Caveats\n\n- Keep the classical half during the transition: the hybrid is at least as strong as either part.\n- Version your protocol so old and new peers can negotiate.\n\n## References\n\n- https://www.rfc-editor.org/info/rfc10024\n- https://csrc.nist.gov/pubs/fips/203/final'
  },
  "go-crypto-migration": {
    id: "go-crypto-migration",
    title: "Go: crypto/mlkem (1.24+) and crypto/mldsa (1.27+)",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDSA",
      "ECDH",
      "Ed25519"
    ],
    why: "`crypto/rsa`, `crypto/ecdsa`, `crypto/ecdh` and `crypto/ed25519` are classical and breakable by a future quantum computer.",
    replacement: "The Go standard library ships ML-KEM (`crypto/mlkem`, Go 1.24+) and ML-DSA (`crypto/mldsa`, Go 1.27+). For TLS nothing is needed beyond Go \u2265 1.24.",
    before: {
      lang: "go",
      code: "priv, _ := rsa.GenerateKey(rand.Reader, 2048)"
    },
    after: {
      lang: "go",
      code: "dk, _ := mlkem.GenerateKey768()          // key establishment\nsharedKey, ciphertext := dk.EncapsulationKey().Encapsulate()\n_ = sharedKey; _ = ciphertext\n\nsk, _ := mldsa.GenerateKey(mldsa.MLDSA65()) // signatures (Go 1.27+)\nsig, _ := sk.Sign(nil, msg, &mldsa.Options{})\n_ = sig"
    },
    caveats: "- Keys and signatures are much larger. ML-DSA-65 signatures are 3,309 bytes.\n- For new protocols, combine ML-KEM with X25519 (hybrid) during the transition.",
    references: [
      "https://pkg.go.dev/crypto/mlkem",
      "https://pkg.go.dev/crypto/mldsa"
    ],
    markdown: "## Why\n\n`crypto/rsa`, `crypto/ecdsa`, `crypto/ecdh` and `crypto/ed25519` are classical and breakable by a future quantum computer.\n\n## Replacement\n\nThe Go standard library ships ML-KEM (`crypto/mlkem`, Go 1.24+) and ML-DSA (`crypto/mldsa`, Go 1.27+). For TLS nothing is needed beyond Go \u2265 1.24.\n\n## Before\n\n```go\npriv, _ := rsa.GenerateKey(rand.Reader, 2048)\n```\n\n## After\n\n```go\ndk, _ := mlkem.GenerateKey768()          // key establishment\nsharedKey, ciphertext := dk.EncapsulationKey().Encapsulate()\n_ = sharedKey; _ = ciphertext\n\nsk, _ := mldsa.GenerateKey(mldsa.MLDSA65()) // signatures (Go 1.27+)\nsig, _ := sk.Sign(nil, msg, &mldsa.Options{})\n_ = sig\n```\n\n## Caveats\n\n- Keys and signatures are much larger. ML-DSA-65 signatures are 3,309 bytes.\n- For new protocols, combine ML-KEM with X25519 (hybrid) during the transition.\n\n## References\n\n- https://pkg.go.dev/crypto/mlkem\n- https://pkg.go.dev/crypto/mldsa"
  },
  "go-tls-pq": {
    id: "go-tls-pq",
    title: "Go: keep X25519MLKEM768 in tls.Config (default since Go 1.24)",
    verified: "2026-10-21",
    appliesTo: [
      "TLS",
      "ECDH"
    ],
    why: "Since Go 1.24, `crypto/tls` offers X25519MLKEM768 by default; Go 1.26 added SecP256r1MLKEM768 and SecP384r1MLKEM1024. A `CurvePreferences` list without them, a `MaxVersion` below TLS 1.3, or a toolchain older than 1.24 turns post-quantum key exchange off.",
    replacement: "Delete `CurvePreferences` (best), or include the hybrid. Build with Go \u2265 1.24.",
    before: {
      lang: "go",
      code: "cfg := &tls.Config{\n    MinVersion:       tls.VersionTLS12,\n    CurvePreferences: []tls.CurveID{tls.CurveP256, tls.X25519},\n}"
    },
    after: {
      lang: "go",
      code: "cfg := &tls.Config{\n    MinVersion: tls.VersionTLS12,\n    // CurvePreferences omitted: Go \u2265 1.24 offers X25519MLKEM768 first.\n    // If you must set it: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256}\n}"
    },
    caveats: "- `GODEBUG=tlsmlkem=0` also disables it. Check your deployment environment.",
    references: [
      "https://github.com/golang/go/issues/69985",
      "https://pkg.go.dev/crypto/tls#Config"
    ],
    markdown: "## Why\n\nSince Go 1.24, `crypto/tls` offers X25519MLKEM768 by default; Go 1.26 added SecP256r1MLKEM768 and SecP384r1MLKEM1024. A `CurvePreferences` list without them, a `MaxVersion` below TLS 1.3, or a toolchain older than 1.24 turns post-quantum key exchange off.\n\n## Replacement\n\nDelete `CurvePreferences` (best), or include the hybrid. Build with Go \u2265 1.24.\n\n## Before\n\n```go\ncfg := &tls.Config{\n    MinVersion:       tls.VersionTLS12,\n    CurvePreferences: []tls.CurveID{tls.CurveP256, tls.X25519},\n}\n```\n\n## After\n\n```go\ncfg := &tls.Config{\n    MinVersion: tls.VersionTLS12,\n    // CurvePreferences omitted: Go \u2265 1.24 offers X25519MLKEM768 first.\n    // If you must set it: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256}\n}\n```\n\n## Caveats\n\n- `GODEBUG=tlsmlkem=0` also disables it. Check your deployment environment.\n\n## References\n\n- https://github.com/golang/go/issues/69985\n- https://pkg.go.dev/crypto/tls#Config"
  },
  "hash-md5-sha1": {
    id: "hash-md5-sha1",
    title: "Replace MD5 / SHA-1 with SHA-256 or SHA-3",
    verified: "2026-10-21",
    appliesTo: [
      "MD5",
      "SHA-1"
    ],
    why: "MD5 and SHA-1 already have practical collision attacks today. This is a classical problem, not a quantum one, but it should be fixed before any post-quantum work. SHA-256/384 and SHA-3 remain acceptable against quantum attackers.",
    replacement: "SHA-256 (or SHA-384 / SHA3-256). For passwords use a password hash (Argon2id, scrypt, bcrypt), not a plain digest.",
    before: {
      lang: "python",
      code: "import hashlib\ndigest = hashlib.md5(data).hexdigest()"
    },
    after: {
      lang: "python",
      code: "import hashlib\ndigest = hashlib.sha256(data).hexdigest()"
    },
    caveats: "- Non-security uses (cache keys, deduplication, ETags) are low priority, but switching costs little.\n- Changing a stored digest format needs a migration path for existing values.",
    references: [
      "https://csrc.nist.gov/projects/hash-functions"
    ],
    markdown: "## Why\n\nMD5 and SHA-1 already have practical collision attacks today. This is a classical problem, not a quantum one, but it should be fixed before any post-quantum work. SHA-256/384 and SHA-3 remain acceptable against quantum attackers.\n\n## Replacement\n\nSHA-256 (or SHA-384 / SHA3-256). For passwords use a password hash (Argon2id, scrypt, bcrypt), not a plain digest.\n\n## Before\n\n```python\nimport hashlib\ndigest = hashlib.md5(data).hexdigest()\n```\n\n## After\n\n```python\nimport hashlib\ndigest = hashlib.sha256(data).hexdigest()\n```\n\n## Caveats\n\n- Non-security uses (cache keys, deduplication, ETags) are low priority, but switching costs little.\n- Changing a stored digest format needs a migration path for existing values.\n\n## References\n\n- https://csrc.nist.gov/projects/hash-functions"
  },
  "java-mlkem": {
    id: "java-mlkem",
    title: "Java: ML-KEM and ML-DSA in the JDK (JDK 24+), hybrid TLS in JDK 27",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "EC",
      "DH",
      "DSA",
      "Ed25519",
      "X25519"
    ],
    why: "`KeyPairGenerator`, `KeyAgreement`, `Signature` and `Cipher` with RSA, EC, DH, DSA or EdDSA are classical and breakable by a future quantum computer.",
    replacement: "JDK 24 added ML-KEM (JEP 496) and ML-DSA (JEP 497) to the standard providers. JDK 27 enables X25519MLKEM768 in TLS by default (JEP 527). On older JDKs use BouncyCastle \u2265 1.79.",
    before: {
      lang: "java",
      code: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");\nkpg.initialize(2048);\nCipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");'
    },
    after: {
      lang: "java",
      code: 'KeyPairGenerator g = KeyPairGenerator.getInstance("ML-KEM");\ng.initialize(NamedParameterSpec.ML_KEM_768);\nKeyPair kp = g.generateKeyPair();\n\nKEM kem = KEM.getInstance("ML-KEM");\nKEM.Encapsulated enc = kem.newEncapsulator(kp.getPublic()).encapsulate();\nSecretKey shared = enc.key();               // send enc.encapsulation() to the peer\n\nSignature s = Signature.getInstance("ML-DSA"); // keys from KeyPairGenerator.getInstance("ML-DSA")'
    },
    caveats: "- ML-KEM gives you a shared secret (KEM), not RSA-style encryption of arbitrary data.\n- For TLS, upgrading to JDK 27 is enough. Remove any `jdk.tls.namedGroups` setting that omits the hybrid.",
    references: [
      "https://openjdk.org/jeps/496",
      "https://openjdk.org/jeps/497",
      "https://openjdk.org/jeps/527"
    ],
    markdown: '## Why\n\n`KeyPairGenerator`, `KeyAgreement`, `Signature` and `Cipher` with RSA, EC, DH, DSA or EdDSA are classical and breakable by a future quantum computer.\n\n## Replacement\n\nJDK 24 added ML-KEM (JEP 496) and ML-DSA (JEP 497) to the standard providers. JDK 27 enables X25519MLKEM768 in TLS by default (JEP 527). On older JDKs use BouncyCastle \u2265 1.79.\n\n## Before\n\n```java\nKeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");\nkpg.initialize(2048);\nCipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");\n```\n\n## After\n\n```java\nKeyPairGenerator g = KeyPairGenerator.getInstance("ML-KEM");\ng.initialize(NamedParameterSpec.ML_KEM_768);\nKeyPair kp = g.generateKeyPair();\n\nKEM kem = KEM.getInstance("ML-KEM");\nKEM.Encapsulated enc = kem.newEncapsulator(kp.getPublic()).encapsulate();\nSecretKey shared = enc.key();               // send enc.encapsulation() to the peer\n\nSignature s = Signature.getInstance("ML-DSA"); // keys from KeyPairGenerator.getInstance("ML-DSA")\n```\n\n## Caveats\n\n- ML-KEM gives you a shared secret (KEM), not RSA-style encryption of arbitrary data.\n- For TLS, upgrading to JDK 27 is enough. Remove any `jdk.tls.namedGroups` setting that omits the hybrid.\n\n## References\n\n- https://openjdk.org/jeps/496\n- https://openjdk.org/jeps/497\n- https://openjdk.org/jeps/527'
  },
  "jwt-crypto-agility": {
    id: "jwt-crypto-agility",
    title: "JWT / JOSE: make the signing algorithm configurable (RS*, ES*, PS*, EdDSA)",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDSA",
      "RSA-PSS",
      "Ed25519"
    ],
    why: "RS256, PS256, ES256 and EdDSA tokens rely on signatures that a future quantum computer can forge. Tokens are short-lived, so the practical risk is forged tokens after Q-Day, not decrypting old ones. The fix is to be ready to switch quickly.",
    replacement: "1. Move the algorithm name and keys into configuration (one place, not every call site).\n2. Publish keys through JWKS with `kid` so you can rotate algorithms without downtime.\n3. Track the IETF JOSE work on ML-DSA (e.g. `ML-DSA-65` identifiers) and switch when your libraries support it.",
    before: {
      lang: "javascript",
      code: "jwt.sign(payload, privateKey, { algorithm: 'RS256' });"
    },
    after: {
      lang: "javascript",
      code: "// config/crypto.js \u2014 the only place that names an algorithm\nexport const JWT_ALG = process.env.JWT_ALG ?? 'ES256';\n// usage\njwt.sign(payload, signingKey, { algorithm: JWT_ALG, keyid: currentKid });"
    },
    caveats: "- HS256 (HMAC) is not affected by Shor; it is not flagged.\n- Always pin the accepted algorithms on verification (`algorithms: [JWT_ALG]`).",
    references: [
      "https://datatracker.ietf.org/wg/jose/documents/"
    ],
    markdown: "## Why\n\nRS256, PS256, ES256 and EdDSA tokens rely on signatures that a future quantum computer can forge. Tokens are short-lived, so the practical risk is forged tokens after Q-Day, not decrypting old ones. The fix is to be ready to switch quickly.\n\n## Replacement\n\n1. Move the algorithm name and keys into configuration (one place, not every call site).\n2. Publish keys through JWKS with `kid` so you can rotate algorithms without downtime.\n3. Track the IETF JOSE work on ML-DSA (e.g. `ML-DSA-65` identifiers) and switch when your libraries support it.\n\n## Before\n\n```javascript\njwt.sign(payload, privateKey, { algorithm: 'RS256' });\n```\n\n## After\n\n```javascript\n// config/crypto.js \u2014 the only place that names an algorithm\nexport const JWT_ALG = process.env.JWT_ALG ?? 'ES256';\n// usage\njwt.sign(payload, signingKey, { algorithm: JWT_ALG, keyid: currentKid });\n```\n\n## Caveats\n\n- HS256 (HMAC) is not affected by Shor; it is not flagged.\n- Always pin the accepted algorithms on verification (`algorithms: [JWT_ALG]`).\n\n## References\n\n- https://datatracker.ietf.org/wg/jose/documents/"
  },
  "k8s-ingress-tls": {
    id: "k8s-ingress-tls",
    title: "Kubernetes ingress / service mesh: TLS 1.2+ and hybrid groups",
    verified: "2026-10-21",
    appliesTo: [
      "TLS"
    ],
    why: "Ingress controllers and meshes have their own TLS settings. Legacy protocol lists or classical-only curve settings apply to every service behind them.",
    replacement: 'ingress-nginx: set `ssl-protocols: "TLSv1.2 TLSv1.3"` and, with a controller image built on OpenSSL \u2265 3.5, `ssl-ecdh-curve: "X25519MLKEM768:X25519:prime256v1"`. Istio/Envoy: `minProtocolVersion: TLSV1_2`. Check your mesh\'s documentation for its post-quantum group support.',
    before: {
      lang: "yaml",
      code: 'data:\n  ssl-protocols: "TLSv1 TLSv1.1 TLSv1.2"\n  ssl-ecdh-curve: "secp384r1"'
    },
    after: {
      lang: "yaml",
      code: 'data:\n  ssl-protocols: "TLSv1.2 TLSv1.3"\n  ssl-ecdh-curve: "X25519MLKEM768:X25519:prime256v1"'
    },
    caveats: "- The curve name only works if the controller's OpenSSL is \u2265 3.5. Check the image's release notes.",
    references: [
      "https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/"
    ],
    markdown: '## Why\n\nIngress controllers and meshes have their own TLS settings. Legacy protocol lists or classical-only curve settings apply to every service behind them.\n\n## Replacement\n\ningress-nginx: set `ssl-protocols: "TLSv1.2 TLSv1.3"` and, with a controller image built on OpenSSL \u2265 3.5, `ssl-ecdh-curve: "X25519MLKEM768:X25519:prime256v1"`. Istio/Envoy: `minProtocolVersion: TLSV1_2`. Check your mesh\'s documentation for its post-quantum group support.\n\n## Before\n\n```yaml\ndata:\n  ssl-protocols: "TLSv1 TLSv1.1 TLSv1.2"\n  ssl-ecdh-curve: "secp384r1"\n```\n\n## After\n\n```yaml\ndata:\n  ssl-protocols: "TLSv1.2 TLSv1.3"\n  ssl-ecdh-curve: "X25519MLKEM768:X25519:prime256v1"\n```\n\n## Caveats\n\n- The curve name only works if the controller\'s OpenSSL is \u2265 3.5. Check the image\'s release notes.\n\n## References\n\n- https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/'
  },
  "legacy-ciphers": {
    id: "legacy-ciphers",
    title: "Replace DES / 3DES / RC4 / Blowfish with AES-256-GCM",
    verified: "2026-10-21",
    appliesTo: [
      "DES",
      "3DES",
      "RC4",
      "RC2",
      "Blowfish"
    ],
    why: "These ciphers are already weak against classical attacks: small keys or blocks, or biased keystreams (RC4). NIST withdrew 3DES for encryption.",
    replacement: "AES-256-GCM or ChaCha20-Poly1305 (authenticated encryption).",
    before: {
      lang: "java",
      code: 'Cipher c = Cipher.getInstance("DESede/CBC/PKCS5Padding");'
    },
    after: {
      lang: "java",
      code: 'Cipher c = Cipher.getInstance("AES/GCM/NoPadding"); // 256-bit key, unique 12-byte IV per message'
    },
    caveats: "- Re-encrypt stored data; keep the old cipher only for one-way decryption during migration.",
    references: [
      "https://csrc.nist.gov/pubs/sp/800/131/a/r2/final"
    ],
    markdown: '## Why\n\nThese ciphers are already weak against classical attacks: small keys or blocks, or biased keystreams (RC4). NIST withdrew 3DES for encryption.\n\n## Replacement\n\nAES-256-GCM or ChaCha20-Poly1305 (authenticated encryption).\n\n## Before\n\n```java\nCipher c = Cipher.getInstance("DESede/CBC/PKCS5Padding");\n```\n\n## After\n\n```java\nCipher c = Cipher.getInstance("AES/GCM/NoPadding"); // 256-bit key, unique 12-byte IV per message\n```\n\n## Caveats\n\n- Re-encrypt stored data; keep the old cipher only for one-way decryption during migration.\n\n## References\n\n- https://csrc.nist.gov/pubs/sp/800/131/a/r2/final'
  },
  "library-pqc-status": {
    id: "library-pqc-status",
    title: "Check the library's post-quantum roadmap",
    verified: "2026-10-21",
    appliesTo: [
      "library"
    ],
    why: "This dependency provides classical public-key cryptography. Listing it in the CBOM shows where migration work will land. The code-level findings show the actual call sites.",
    replacement: "Known post-quantum support (checked on the verification date):\n\n- pyca/cryptography \u2265 48: ML-KEM, ML-DSA.\n- BouncyCastle Java \u2265 1.79: ML-KEM, ML-DSA, SLH-DSA.\n- JDK \u2265 24: ML-KEM, ML-DSA. JDK 27: hybrid TLS by default.\n- Go \u2265 1.24: crypto/mlkem and PQ TLS by default. Go \u2265 1.27: crypto/mldsa.\n- Node.js 24: ml-kem / ml-dsa key types; \u2265 24.5 bundles OpenSSL 3.5.\n- JOSE/JWT libraries: ML-DSA support is still emerging. Keep the algorithm configurable.",
    caveats: "- Library presence alone is low-confidence: it does not prove the classical algorithms are used.",
    references: [
      "https://csrc.nist.gov/projects/post-quantum-cryptography"
    ],
    markdown: "## Why\n\nThis dependency provides classical public-key cryptography. Listing it in the CBOM shows where migration work will land. The code-level findings show the actual call sites.\n\n## Replacement\n\nKnown post-quantum support (checked on the verification date):\n\n- pyca/cryptography \u2265 48: ML-KEM, ML-DSA.\n- BouncyCastle Java \u2265 1.79: ML-KEM, ML-DSA, SLH-DSA.\n- JDK \u2265 24: ML-KEM, ML-DSA. JDK 27: hybrid TLS by default.\n- Go \u2265 1.24: crypto/mlkem and PQ TLS by default. Go \u2265 1.27: crypto/mldsa.\n- Node.js 24: ml-kem / ml-dsa key types; \u2265 24.5 bundles OpenSSL 3.5.\n- JOSE/JWT libraries: ML-DSA support is still emerging. Keep the algorithm configurable.\n\n## Caveats\n\n- Library presence alone is low-confidence: it does not prove the classical algorithms are used.\n\n## References\n\n- https://csrc.nist.gov/projects/post-quantum-cryptography"
  },
  "node-crypto-migration": {
    id: "node-crypto-migration",
    title: "Node.js: ML-KEM and ML-DSA in node:crypto",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDSA",
      "ECDH",
      "Ed25519",
      "X25519",
      "DH"
    ],
    why: "RSA, ECDSA, ECDH, Ed25519 and X25519 keys from `crypto.generateKeyPair`, WebCrypto or libraries like node-forge, elliptic and tweetnacl are breakable by a future quantum computer.",
    replacement: "Recent Node.js 24 releases support `ml-kem-*` and `ml-dsa-*` key types (verified on 24.11.1), with `crypto.encapsulate` / `crypto.decapsulate` for KEMs and `crypto.sign(null, \u2026)` for ML-DSA.",
    before: {
      lang: "javascript",
      code: "const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });"
    },
    after: {
      lang: "javascript",
      code: "const kem = crypto.generateKeyPairSync('ml-kem-768');\nconst { sharedKey, ciphertext } = crypto.encapsulate(kem.publicKey);\nconst same = crypto.decapsulate(kem.privateKey, ciphertext);\n\nconst sig = crypto.generateKeyPairSync('ml-dsa-65');\nconst signature = crypto.sign(null, data, sig.privateKey);\ncrypto.verify(null, data, sig.publicKey, signature);"
    },
    caveats: "- In the browser, WebCrypto has no ML-KEM yet. Use a vetted library such as `@noble/post-quantum`, or do key establishment server-side.\n- Use a hybrid (X25519 + ML-KEM) for new protocols during the transition.",
    references: [
      "https://nodejs.org/api/crypto.html"
    ],
    markdown: "## Why\n\nRSA, ECDSA, ECDH, Ed25519 and X25519 keys from `crypto.generateKeyPair`, WebCrypto or libraries like node-forge, elliptic and tweetnacl are breakable by a future quantum computer.\n\n## Replacement\n\nRecent Node.js 24 releases support `ml-kem-*` and `ml-dsa-*` key types (verified on 24.11.1), with `crypto.encapsulate` / `crypto.decapsulate` for KEMs and `crypto.sign(null, \u2026)` for ML-DSA.\n\n## Before\n\n```javascript\nconst { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });\n```\n\n## After\n\n```javascript\nconst kem = crypto.generateKeyPairSync('ml-kem-768');\nconst { sharedKey, ciphertext } = crypto.encapsulate(kem.publicKey);\nconst same = crypto.decapsulate(kem.privateKey, ciphertext);\n\nconst sig = crypto.generateKeyPairSync('ml-dsa-65');\nconst signature = crypto.sign(null, data, sig.privateKey);\ncrypto.verify(null, data, sig.publicKey, signature);\n```\n\n## Caveats\n\n- In the browser, WebCrypto has no ML-KEM yet. Use a vetted library such as `@noble/post-quantum`, or do key establishment server-side.\n- Use a hybrid (X25519 + ML-KEM) for new protocols during the transition.\n\n## References\n\n- https://nodejs.org/api/crypto.html"
  },
  "node-tls-pq": {
    id: "node-tls-pq",
    title: "Node.js: allow X25519MLKEM768 in TLS (Node \u2265 24.5 / OpenSSL 3.5)",
    verified: "2026-10-21",
    appliesTo: [
      "TLS",
      "ECDH"
    ],
    why: "`ecdhCurve` lists without a hybrid group, or `maxVersion: 'TLSv1.2'`, force classical key exchange on servers and clients.",
    replacement: "Run Node.js \u2265 24.5 (or \u2265 22.20), which bundles OpenSSL 3.5. Either drop `ecdhCurve` to use the defaults, or list the hybrid first.",
    before: {
      lang: "javascript",
      code: "https.createServer({ key, cert, ecdhCurve: 'prime256v1', minVersion: 'TLSv1' }, app);"
    },
    after: {
      lang: "javascript",
      code: "https.createServer({ key, cert, ecdhCurve: 'X25519MLKEM768:X25519:prime256v1', minVersion: 'TLSv1.2' }, app);\n// check: process.versions.openssl >= '3.5'"
    },
    caveats: "- On Node.js built against a system OpenSSL < 3.5 the group name is rejected.",
    references: [
      "https://nodejs.org/api/tls.html",
      "https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/"
    ],
    markdown: "## Why\n\n`ecdhCurve` lists without a hybrid group, or `maxVersion: 'TLSv1.2'`, force classical key exchange on servers and clients.\n\n## Replacement\n\nRun Node.js \u2265 24.5 (or \u2265 22.20), which bundles OpenSSL 3.5. Either drop `ecdhCurve` to use the defaults, or list the hybrid first.\n\n## Before\n\n```javascript\nhttps.createServer({ key, cert, ecdhCurve: 'prime256v1', minVersion: 'TLSv1' }, app);\n```\n\n## After\n\n```javascript\nhttps.createServer({ key, cert, ecdhCurve: 'X25519MLKEM768:X25519:prime256v1', minVersion: 'TLSv1.2' }, app);\n// check: process.versions.openssl >= '3.5'\n```\n\n## Caveats\n\n- On Node.js built against a system OpenSSL < 3.5 the group name is rejected.\n\n## References\n\n- https://nodejs.org/api/tls.html\n- https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/"
  },
  "pq-library-present": {
    id: "pq-library-present",
    title: "Post-quantum library detected",
    verified: "2026-10-21",
    appliesTo: [
      "ML-KEM",
      "ML-DSA"
    ],
    why: "This dependency implements post-quantum algorithms (ML-KEM / ML-DSA / SLH-DSA). That's good news: it is listed in the CBOM as a quantum-safe asset.",
    replacement: "No change needed. Keep it updated and make sure it is actually used where classical algorithms remain.",
    caveats: "- Prefer implementations of the final FIPS 203/204/205 standards over pre-standard (Kyber/Dilithium round-3) variants.",
    references: [
      "https://csrc.nist.gov/projects/post-quantum-cryptography"
    ],
    markdown: "## Why\n\nThis dependency implements post-quantum algorithms (ML-KEM / ML-DSA / SLH-DSA). That's good news: it is listed in the CBOM as a quantum-safe asset.\n\n## Replacement\n\nNo change needed. Keep it updated and make sure it is actually used where classical algorithms remain.\n\n## Caveats\n\n- Prefer implementations of the final FIPS 203/204/205 standards over pre-standard (Kyber/Dilithium round-3) variants.\n\n## References\n\n- https://csrc.nist.gov/projects/post-quantum-cryptography"
  },
  "private-key-in-repo": {
    id: "private-key-in-repo",
    title: "Remove private keys from the repository and rotate them",
    verified: "2026-10-21",
    appliesTo: [
      "private key"
    ],
    why: "A private key committed to source control should be treated as exposed to everyone with read access, now and in every past clone and fork. This matters regardless of quantum computing.",
    replacement: "1. Revoke or rotate the key (issue a new certificate / deploy a new SSH key).\n2. Remove the file and purge it from history (`git filter-repo`), then force-push and ask collaborators to re-clone.\n3. Load keys at runtime from a secret store (environment, Vault, cloud KMS) and add the pattern to `.gitignore`.\n4. When generating the replacement, consider whether it can be post-quantum (ML-DSA / ML-KEM) or at least crypto-agile.",
    before: {
      lang: "text",
      code: "repo/\n  certs/server.key   \u2190 committed"
    },
    after: {
      lang: "text",
      code: "repo/\n  .gitignore          *.key\n  config loads SERVER_KEY from the secret store at startup"
    },
    caveats: "- Test fixtures with throw-away keys are fine. Mark them clearly or keep them under `test/fixtures/`, and exclude that path from the scan.",
    references: [
      "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"
    ],
    markdown: "## Why\n\nA private key committed to source control should be treated as exposed to everyone with read access, now and in every past clone and fork. This matters regardless of quantum computing.\n\n## Replacement\n\n1. Revoke or rotate the key (issue a new certificate / deploy a new SSH key).\n2. Remove the file and purge it from history (`git filter-repo`), then force-push and ask collaborators to re-clone.\n3. Load keys at runtime from a secret store (environment, Vault, cloud KMS) and add the pattern to `.gitignore`.\n4. When generating the replacement, consider whether it can be post-quantum (ML-DSA / ML-KEM) or at least crypto-agile.\n\n## Before\n\n```text\nrepo/\n  certs/server.key   \u2190 committed\n```\n\n## After\n\n```text\nrepo/\n  .gitignore          *.key\n  config loads SERVER_KEY from the secret store at startup\n```\n\n## Caveats\n\n- Test fixtures with throw-away keys are fine. Mark them clearly or keep them under `test/fixtures/`, and exclude that path from the scan.\n\n## References\n\n- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"
  },
  "py-rsa-to-mlkem": {
    id: "py-rsa-to-mlkem",
    title: "Python: replace RSA key transport with ML-KEM (pyca/cryptography \u2265 48)",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDH",
      "DH",
      "X25519"
    ],
    why: "RSA encryption and RSA/ECDH-based key establishment are broken by Shor's algorithm. Anything encrypted with them today can be recorded now and decrypted once a large quantum computer exists (harvest now, decrypt later).",
    replacement: "Use ML-KEM-768 (FIPS 203). pyca/cryptography 48 and later ships ML-KEM and ML-DSA. During the transition, prefer a hybrid: derive the session key from both an X25519 shared secret and an ML-KEM shared secret, e.g. with HKDF over the concatenation.",
    before: {
      lang: "python",
      code: "from cryptography.hazmat.primitives.asymmetric import rsa, padding\nfrom cryptography.hazmat.primitives import hashes\n\nkey = rsa.generate_private_key(public_exponent=65537, key_size=2048)\nct = key.public_key().encrypt(session_key, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))"
    },
    after: {
      lang: "python",
      code: '# pip install "cryptography>=48"\nfrom cryptography.hazmat.primitives.asymmetric import mlkem\n\nsk = mlkem.MLKEM768PrivateKey.generate()\npk = sk.public_key()\n\nshared_secret, ciphertext = pk.encapsulate()   # sender\nassert sk.decapsulate(ciphertext) == shared_secret  # receiver'
    },
    caveats: '- ML-KEM is a KEM, not public-key encryption: you get a shared secret to key a symmetric cipher (e.g. AES-256-GCM), not "encrypt this blob".\n- Keys and ciphertexts are larger (ML-KEM-768 ciphertext: 1,088 bytes). Check length fields and storage columns.\n- Check which backend your wheel uses (AWS-LC / OpenSSL) supports ML-KEM on your platform. If you cannot upgrade yet, liboqs-python is an alternative (see the Open Quantum Safe project).',
    references: [
      "https://blog.trailofbits.com/2026/06/30/shipping-post-quantum-cryptography-to-python/",
      "https://csrc.nist.gov/pubs/fips/203/final"
    ],
    markdown: '## Why\n\nRSA encryption and RSA/ECDH-based key establishment are broken by Shor\'s algorithm. Anything encrypted with them today can be recorded now and decrypted once a large quantum computer exists (harvest now, decrypt later).\n\n## Replacement\n\nUse ML-KEM-768 (FIPS 203). pyca/cryptography 48 and later ships ML-KEM and ML-DSA. During the transition, prefer a hybrid: derive the session key from both an X25519 shared secret and an ML-KEM shared secret, e.g. with HKDF over the concatenation.\n\n## Before\n\n```python\nfrom cryptography.hazmat.primitives.asymmetric import rsa, padding\nfrom cryptography.hazmat.primitives import hashes\n\nkey = rsa.generate_private_key(public_exponent=65537, key_size=2048)\nct = key.public_key().encrypt(session_key, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))\n```\n\n## After\n\n```python\n# pip install "cryptography>=48"\nfrom cryptography.hazmat.primitives.asymmetric import mlkem\n\nsk = mlkem.MLKEM768PrivateKey.generate()\npk = sk.public_key()\n\nshared_secret, ciphertext = pk.encapsulate()   # sender\nassert sk.decapsulate(ciphertext) == shared_secret  # receiver\n```\n\n## Caveats\n\n- ML-KEM is a KEM, not public-key encryption: you get a shared secret to key a symmetric cipher (e.g. AES-256-GCM), not "encrypt this blob".\n- Keys and ciphertexts are larger (ML-KEM-768 ciphertext: 1,088 bytes). Check length fields and storage columns.\n- Check which backend your wheel uses (AWS-LC / OpenSSL) supports ML-KEM on your platform. If you cannot upgrade yet, liboqs-python is an alternative (see the Open Quantum Safe project).\n\n## References\n\n- https://blog.trailofbits.com/2026/06/30/shipping-post-quantum-cryptography-to-python/\n- https://csrc.nist.gov/pubs/fips/203/final'
  },
  "python-pqc": {
    id: "python-pqc",
    title: "Python: post-quantum options (cryptography \u2265 48, liboqs-python)",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECC",
      "DSA",
      "Ed25519",
      "X25519"
    ],
    why: "PyCryptodome, python-rsa, python-ecdsa, paramiko keys and the classical parts of `cryptography` are breakable by a future quantum computer.",
    replacement: "- **pyca/cryptography \u2265 48**: `cryptography.hazmat.primitives.asymmetric.mlkem` (ML-KEM-768) and `.mldsa` (ML-DSA-65).\n- **liboqs-python** (Open Quantum Safe): broad algorithm coverage for prototypes; check its own production guidance.",
    before: {
      lang: "python",
      code: "from Crypto.PublicKey import RSA\nkey = RSA.generate(2048)"
    },
    after: {
      lang: "python",
      code: "from cryptography.hazmat.primitives.asymmetric import mldsa, mlkem\n\nkem_key = mlkem.MLKEM768PrivateKey.generate()\nsig_key = mldsa.MLDSA65PrivateKey.generate()"
    },
    caveats: "- Not drop-in: sizes and APIs differ (KEM instead of encrypt; 3.3 KB signatures).\n- SLH-DSA is not in cryptography 48.",
    references: [
      "https://blog.trailofbits.com/2026/06/30/shipping-post-quantum-cryptography-to-python/",
      "https://github.com/open-quantum-safe/liboqs-python"
    ],
    markdown: "## Why\n\nPyCryptodome, python-rsa, python-ecdsa, paramiko keys and the classical parts of `cryptography` are breakable by a future quantum computer.\n\n## Replacement\n\n- **pyca/cryptography \u2265 48**: `cryptography.hazmat.primitives.asymmetric.mlkem` (ML-KEM-768) and `.mldsa` (ML-DSA-65).\n- **liboqs-python** (Open Quantum Safe): broad algorithm coverage for prototypes; check its own production guidance.\n\n## Before\n\n```python\nfrom Crypto.PublicKey import RSA\nkey = RSA.generate(2048)\n```\n\n## After\n\n```python\nfrom cryptography.hazmat.primitives.asymmetric import mldsa, mlkem\n\nkem_key = mlkem.MLKEM768PrivateKey.generate()\nsig_key = mldsa.MLDSA65PrivateKey.generate()\n```\n\n## Caveats\n\n- Not drop-in: sizes and APIs differ (KEM instead of encrypt; 3.3 KB signatures).\n- SLH-DSA is not in cryptography 48.\n\n## References\n\n- https://blog.trailofbits.com/2026/06/30/shipping-post-quantum-cryptography-to-python/\n- https://github.com/open-quantum-safe/liboqs-python"
  },
  "rsa-to-mlkem": {
    id: "rsa-to-mlkem",
    title: "Replace RSA encryption / key transport with ML-KEM (hybrid)",
    verified: "2026-10-21",
    appliesTo: [
      "RSA"
    ],
    why: "RSA is broken by Shor's algorithm. Data or session keys wrapped with RSA today can be recorded and decrypted later by a quantum computer.",
    replacement: "Use ML-KEM-768 (FIPS 203) to establish a shared secret, ideally as a hybrid with X25519 (X25519MLKEM768 in TLS). Then encrypt data with AES-256-GCM using a key derived from the shared secret. For TLS, simply upgrading the TLS library usually suffices: OpenSSL \u2265 3.5, Go \u2265 1.24, Node.js \u2265 24.5, JDK 27 and all major browsers negotiate X25519MLKEM768.",
    before: {
      lang: "text",
      code: "session_key \u2192 RSA-OAEP(public_key) \u2192 send"
    },
    after: {
      lang: "text",
      code: "(shared_secret, ct) = ML-KEM-768.Encapsulate(pk)   # optionally combined with X25519\nkey = HKDF-SHA256(shared_secret || x25519_secret)\nsend(ct, AES-256-GCM(key, data))"
    },
    caveats: "- RSA signatures need a different migration (ML-DSA). See the signatures fix.\n- Larger keys and ciphertexts; protocol length fields may need changes.",
    references: [
      "https://csrc.nist.gov/pubs/fips/203/final",
      "https://www.rfc-editor.org/info/rfc10024"
    ],
    markdown: "## Why\n\nRSA is broken by Shor's algorithm. Data or session keys wrapped with RSA today can be recorded and decrypted later by a quantum computer.\n\n## Replacement\n\nUse ML-KEM-768 (FIPS 203) to establish a shared secret, ideally as a hybrid with X25519 (X25519MLKEM768 in TLS). Then encrypt data with AES-256-GCM using a key derived from the shared secret. For TLS, simply upgrading the TLS library usually suffices: OpenSSL \u2265 3.5, Go \u2265 1.24, Node.js \u2265 24.5, JDK 27 and all major browsers negotiate X25519MLKEM768.\n\n## Before\n\n```text\nsession_key \u2192 RSA-OAEP(public_key) \u2192 send\n```\n\n## After\n\n```text\n(shared_secret, ct) = ML-KEM-768.Encapsulate(pk)   # optionally combined with X25519\nkey = HKDF-SHA256(shared_secret || x25519_secret)\nsend(ct, AES-256-GCM(key, data))\n```\n\n## Caveats\n\n- RSA signatures need a different migration (ML-DSA). See the signatures fix.\n- Larger keys and ciphertexts; protocol length fields may need changes.\n\n## References\n\n- https://csrc.nist.gov/pubs/fips/203/final\n- https://www.rfc-editor.org/info/rfc10024"
  },
  "signatures-to-mldsa": {
    id: "signatures-to-mldsa",
    title: "Plan the move from RSA / ECDSA / EdDSA signatures to ML-DSA",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDSA",
      "ECC",
      "Ed25519",
      "DSA"
    ],
    why: "Classical signatures will be forgeable once a cryptographically relevant quantum computer exists. Unlike key exchange, signatures are not exposed to harvest-now-decrypt-later. They matter most for long-lived trust: firmware and code signing, document signatures and root keys.",
    replacement: 'ML-DSA (FIPS 204), e.g. ML-DSA-65; SLH-DSA (FIPS 205) for very long-lived roots. Libraries with ML-DSA today: OpenSSL 3.5, Go 1.27 (`crypto/mldsa`), Node.js 24 (`ml-dsa-65` key type), JDK 24+ (`Signature.getInstance("ML-DSA")`), pyca/cryptography \u2265 48, BouncyCastle \u2265 1.79. Right now the most valuable step is **crypto-agility**: read the algorithm from configuration, in one place, so you can switch without a code hunt.',
    before: {
      lang: "python",
      code: "signature = private_key.sign(data, ec.ECDSA(hashes.SHA256()))"
    },
    after: {
      lang: "python",
      code: '# pip install "cryptography>=48"\nfrom cryptography.hazmat.primitives.asymmetric import mldsa\n\nsk = mldsa.MLDSA65PrivateKey.generate()\nsig = sk.sign(data)\nsk.public_key().verify(sig, data)'
    },
    caveats: "- ML-DSA-65 signatures are 3,309 bytes (Ed25519: 64). Check size limits in headers, tokens, databases and QR codes.\n- Public web certificates cannot use ML-DSA yet; this applies to your own signing systems first.",
    references: [
      "https://csrc.nist.gov/pubs/fips/204/final",
      "https://csrc.nist.gov/pubs/fips/205/final"
    ],
    markdown: '## Why\n\nClassical signatures will be forgeable once a cryptographically relevant quantum computer exists. Unlike key exchange, signatures are not exposed to harvest-now-decrypt-later. They matter most for long-lived trust: firmware and code signing, document signatures and root keys.\n\n## Replacement\n\nML-DSA (FIPS 204), e.g. ML-DSA-65; SLH-DSA (FIPS 205) for very long-lived roots. Libraries with ML-DSA today: OpenSSL 3.5, Go 1.27 (`crypto/mldsa`), Node.js 24 (`ml-dsa-65` key type), JDK 24+ (`Signature.getInstance("ML-DSA")`), pyca/cryptography \u2265 48, BouncyCastle \u2265 1.79. Right now the most valuable step is **crypto-agility**: read the algorithm from configuration, in one place, so you can switch without a code hunt.\n\n## Before\n\n```python\nsignature = private_key.sign(data, ec.ECDSA(hashes.SHA256()))\n```\n\n## After\n\n```python\n# pip install "cryptography>=48"\nfrom cryptography.hazmat.primitives.asymmetric import mldsa\n\nsk = mldsa.MLDSA65PrivateKey.generate()\nsig = sk.sign(data)\nsk.public_key().verify(sig, data)\n```\n\n## Caveats\n\n- ML-DSA-65 signatures are 3,309 bytes (Ed25519: 64). Check size limits in headers, tokens, databases and QR codes.\n- Public web certificates cannot use ML-DSA yet; this applies to your own signing systems first.\n\n## References\n\n- https://csrc.nist.gov/pubs/fips/204/final\n- https://csrc.nist.gov/pubs/fips/205/final'
  },
  "ssh-keys": {
    id: "ssh-keys",
    title: "SSH: post-quantum key exchange is already the default; keys are still classical",
    verified: "2026-10-21",
    appliesTo: [
      "RSA",
      "ECDSA",
      "Ed25519",
      "DSA"
    ],
    why: "SSH host and user keys (RSA, ECDSA, Ed25519) are classical signatures. Since OpenSSH 10.0, the default key exchange is the hybrid `mlkem768x25519-sha256`. Recorded SSH sessions are protected if both ends are recent.",
    replacement: "- Upgrade OpenSSH on clients and servers (\u2265 10.0), and don't pin `KexAlgorithms` to classical-only lists.\n- Prefer Ed25519 keys over RSA/DSA today (DSA is disabled in modern OpenSSH).\n- Post-quantum SSH signatures are still being standardised. Keep key rotation automated.",
    before: {
      lang: "text",
      code: "KexAlgorithms curve25519-sha256,ecdh-sha2-nistp256\nssh-keygen -t rsa -b 2048"
    },
    after: {
      lang: "text",
      code: "KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512,curve25519-sha256\nssh-keygen -t ed25519"
    },
    caveats: "- Paramiko and other SSH libraries may lag behind OpenSSH. Check their key-exchange support.",
    references: [
      "https://www.openssh.com/txt/release-10.0"
    ],
    markdown: "## Why\n\nSSH host and user keys (RSA, ECDSA, Ed25519) are classical signatures. Since OpenSSH 10.0, the default key exchange is the hybrid `mlkem768x25519-sha256`. Recorded SSH sessions are protected if both ends are recent.\n\n## Replacement\n\n- Upgrade OpenSSH on clients and servers (\u2265 10.0), and don't pin `KexAlgorithms` to classical-only lists.\n- Prefer Ed25519 keys over RSA/DSA today (DSA is disabled in modern OpenSSH).\n- Post-quantum SSH signatures are still being standardised. Keep key rotation automated.\n\n## Before\n\n```text\nKexAlgorithms curve25519-sha256,ecdh-sha2-nistp256\nssh-keygen -t rsa -b 2048\n```\n\n## After\n\n```text\nKexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512,curve25519-sha256\nssh-keygen -t ed25519\n```\n\n## Caveats\n\n- Paramiko and other SSH libraries may lag behind OpenSSH. Check their key-exchange support.\n\n## References\n\n- https://www.openssh.com/txt/release-10.0"
  },
  "symmetric-aes256": {
    id: "symmetric-aes256",
    title: "Use AES-256 instead of AES-128 for long-lived data",
    verified: "2026-10-21",
    appliesTo: [
      "AES-128"
    ],
    why: "Grover's algorithm gives a quadratic speed-up against brute force, reducing AES-128 to roughly 64-bit security against a quantum attacker in theory. The practical risk is low, but data that must stay secret for decades should use 256-bit keys.",
    replacement: "AES-256-GCM (or ChaCha20-Poly1305).",
    before: {
      lang: "javascript",
      code: "crypto.createCipheriv('aes-128-gcm', key16, iv);"
    },
    after: {
      lang: "javascript",
      code: "crypto.createCipheriv('aes-256-gcm', key32, iv); // 32-byte key"
    },
    caveats: "- Low priority compared with public-key migration. Grover is hard to parallelise and needs very long-running quantum computations.",
    references: [
      "https://csrc.nist.gov/projects/post-quantum-cryptography/faqs"
    ],
    markdown: "## Why\n\nGrover's algorithm gives a quadratic speed-up against brute force, reducing AES-128 to roughly 64-bit security against a quantum attacker in theory. The practical risk is low, but data that must stay secret for decades should use 256-bit keys.\n\n## Replacement\n\nAES-256-GCM (or ChaCha20-Poly1305).\n\n## Before\n\n```javascript\ncrypto.createCipheriv('aes-128-gcm', key16, iv);\n```\n\n## After\n\n```javascript\ncrypto.createCipheriv('aes-256-gcm', key32, iv); // 32-byte key\n```\n\n## Caveats\n\n- Low priority compared with public-key migration. Grover is hard to parallelise and needs very long-running quantum computations.\n\n## References\n\n- https://csrc.nist.gov/projects/post-quantum-cryptography/faqs"
  },
  "tls-apache-pq": {
    id: "tls-apache-pq",
    title: "Apache httpd: enable TLS 1.3 and the X25519MLKEM768 group",
    verified: "2026-10-21",
    appliesTo: [
      "TLS"
    ],
    why: "`SSLOpenSSLConfCmd Curves` / `Groups` without a hybrid, or `SSLProtocol` lines that keep TLS 1.0/1.1, mean classical-only key exchange or deprecated protocols.",
    replacement: "Use mod_ssl linked against OpenSSL \u2265 3.5, then configure the groups and protocols explicitly.",
    before: {
      lang: "apache",
      code: "SSLProtocol all -SSLv3\nSSLOpenSSLConfCmd Curves prime256v1"
    },
    after: {
      lang: "apache",
      code: "SSLProtocol -all +TLSv1.3 +TLSv1.2\nSSLOpenSSLConfCmd Groups X25519MLKEM768:X25519:prime256v1"
    },
    caveats: "- `all` in Apache 2.4 still includes TLS 1.0 and 1.1 unless removed explicitly.",
    references: [
      "https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslopensslconfcmd"
    ],
    markdown: "## Why\n\n`SSLOpenSSLConfCmd Curves` / `Groups` without a hybrid, or `SSLProtocol` lines that keep TLS 1.0/1.1, mean classical-only key exchange or deprecated protocols.\n\n## Replacement\n\nUse mod_ssl linked against OpenSSL \u2265 3.5, then configure the groups and protocols explicitly.\n\n## Before\n\n```apache\nSSLProtocol all -SSLv3\nSSLOpenSSLConfCmd Curves prime256v1\n```\n\n## After\n\n```apache\nSSLProtocol -all +TLSv1.3 +TLSv1.2\nSSLOpenSSLConfCmd Groups X25519MLKEM768:X25519:prime256v1\n```\n\n## Caveats\n\n- `all` in Apache 2.4 still includes TLS 1.0 and 1.1 unless removed explicitly.\n\n## References\n\n- https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslopensslconfcmd"
  },
  "tls-haproxy-pq": {
    id: "tls-haproxy-pq",
    title: "HAProxy: add X25519MLKEM768 to the curves list",
    verified: "2026-10-21",
    appliesTo: [
      "TLS"
    ],
    why: "A `curves` / `ssl-default-bind-curves` list without a post-quantum hybrid limits clients to classical key exchange.",
    replacement: "Run HAProxy built with OpenSSL \u2265 3.5 (or AWS-LC), then list the hybrid first.",
    before: {
      lang: "haproxy",
      code: "global\n  ssl-default-bind-curves P-256:X25519\n  ssl-default-bind-options ssl-min-ver TLSv1.0"
    },
    after: {
      lang: "haproxy",
      code: "global\n  ssl-default-bind-curves X25519MLKEM768:X25519:P-256\n  ssl-default-bind-options ssl-min-ver TLSv1.2"
    },
    caveats: "- Check `haproxy -vv` for the SSL library version before deploying the new names.",
    references: [
      "https://docs.haproxy.org/"
    ],
    markdown: "## Why\n\nA `curves` / `ssl-default-bind-curves` list without a post-quantum hybrid limits clients to classical key exchange.\n\n## Replacement\n\nRun HAProxy built with OpenSSL \u2265 3.5 (or AWS-LC), then list the hybrid first.\n\n## Before\n\n```haproxy\nglobal\n  ssl-default-bind-curves P-256:X25519\n  ssl-default-bind-options ssl-min-ver TLSv1.0\n```\n\n## After\n\n```haproxy\nglobal\n  ssl-default-bind-curves X25519MLKEM768:X25519:P-256\n  ssl-default-bind-options ssl-min-ver TLSv1.2\n```\n\n## Caveats\n\n- Check `haproxy -vv` for the SSL library version before deploying the new names.\n\n## References\n\n- https://docs.haproxy.org/"
  },
  "tls-legacy-protocols": {
    id: "tls-legacy-protocols",
    title: "Turn off SSLv3 / TLS 1.0 / TLS 1.1",
    verified: "2026-10-21",
    appliesTo: [
      "TLS 1.0",
      "TLS 1.1",
      "SSLv3"
    ],
    why: "TLS 1.0 and 1.1 were deprecated by RFC 8996 (2021). They cannot carry post-quantum key exchange, and they rely on outdated constructions (SHA-1/MD5 handshake hashes, CBC padding issues).",
    replacement: "Allow TLS 1.2 and 1.3 only; prefer 1.3, the only version with post-quantum hybrid groups.",
    before: {
      lang: "text",
      code: "ssl_protocols TLSv1 TLSv1.1 TLSv1.2;      # nginx\nminVersion: 'TLSv1'                         # Node.js\nMinVersion: tls.VersionTLS10                # Go"
    },
    after: {
      lang: "text",
      code: "ssl_protocols TLSv1.3 TLSv1.2;\nminVersion: 'TLSv1.2'\nMinVersion: tls.VersionTLS12"
    },
    caveats: "- Very old clients (Android \u2264 4.3, Windows XP-era software) will no longer connect. Check your access logs first.",
    references: [
      "https://www.rfc-editor.org/rfc/rfc8996"
    ],
    markdown: "## Why\n\nTLS 1.0 and 1.1 were deprecated by RFC 8996 (2021). They cannot carry post-quantum key exchange, and they rely on outdated constructions (SHA-1/MD5 handshake hashes, CBC padding issues).\n\n## Replacement\n\nAllow TLS 1.2 and 1.3 only; prefer 1.3, the only version with post-quantum hybrid groups.\n\n## Before\n\n```text\nssl_protocols TLSv1 TLSv1.1 TLSv1.2;      # nginx\nminVersion: 'TLSv1'                         # Node.js\nMinVersion: tls.VersionTLS10                # Go\n```\n\n## After\n\n```text\nssl_protocols TLSv1.3 TLSv1.2;\nminVersion: 'TLSv1.2'\nMinVersion: tls.VersionTLS12\n```\n\n## Caveats\n\n- Very old clients (Android \u2264 4.3, Windows XP-era software) will no longer connect. Check your access logs first.\n\n## References\n\n- https://www.rfc-editor.org/rfc/rfc8996"
  },
  "tls-library-pq": {
    id: "tls-library-pq",
    title: "Don't pin TLS key exchange to a classical curve",
    verified: "2026-10-21",
    appliesTo: [
      "TLS",
      "ECDH"
    ],
    why: 'Pinning the key-exchange group (e.g. `ctx.set_ecdh_curve("prime256v1")` in Python, `jdk.tls.namedGroups=secp256r1` in Java) overrides library defaults that already include X25519MLKEM768 in current versions.',
    replacement: "Remove the pin and let the TLS library choose. Make sure the library is new enough: Python linked against OpenSSL \u2265 3.5 (`ssl.OPENSSL_VERSION`), JDK 27, Node.js \u2265 24.5, Go \u2265 1.24. If you must restrict groups, put the hybrid first.",
    before: {
      lang: "python",
      code: 'ctx = ssl.create_default_context()\nctx.set_ecdh_curve("prime256v1")'
    },
    after: {
      lang: "python",
      code: "ctx = ssl.create_default_context()   # OpenSSL 3.5 default groups start with X25519MLKEM768\nctx.minimum_version = ssl.TLSVersion.TLSv1_2"
    },
    caveats: "- Python's `set_ecdh_curve` accepts a single name only, so the safest choice is not to call it.",
    references: [
      "https://docs.python.org/3/library/ssl.html",
      "https://openjdk.org/jeps/527"
    ],
    markdown: '## Why\n\nPinning the key-exchange group (e.g. `ctx.set_ecdh_curve("prime256v1")` in Python, `jdk.tls.namedGroups=secp256r1` in Java) overrides library defaults that already include X25519MLKEM768 in current versions.\n\n## Replacement\n\nRemove the pin and let the TLS library choose. Make sure the library is new enough: Python linked against OpenSSL \u2265 3.5 (`ssl.OPENSSL_VERSION`), JDK 27, Node.js \u2265 24.5, Go \u2265 1.24. If you must restrict groups, put the hybrid first.\n\n## Before\n\n```python\nctx = ssl.create_default_context()\nctx.set_ecdh_curve("prime256v1")\n```\n\n## After\n\n```python\nctx = ssl.create_default_context()   # OpenSSL 3.5 default groups start with X25519MLKEM768\nctx.minimum_version = ssl.TLSVersion.TLSv1_2\n```\n\n## Caveats\n\n- Python\'s `set_ecdh_curve` accepts a single name only, so the safest choice is not to call it.\n\n## References\n\n- https://docs.python.org/3/library/ssl.html\n- https://openjdk.org/jeps/527'
  },
  "tls-nginx-pq": {
    id: "tls-nginx-pq",
    title: "nginx: offer X25519MLKEM768 (needs OpenSSL \u2265 3.5)",
    verified: "2026-10-21",
    appliesTo: [
      "TLS"
    ],
    why: "An `ssl_ecdh_curve` list without a post-quantum hybrid, or `ssl_protocols` without TLSv1.3, means every connection uses classical key exchange. That traffic is exposed to harvest-now-decrypt-later.",
    replacement: "Build or install nginx linked against OpenSSL 3.5 or newer (`nginx -V` shows the OpenSSL version), enable TLS 1.3 and put the hybrid group first.",
    before: {
      lang: "nginx",
      code: "ssl_protocols TLSv1 TLSv1.1 TLSv1.2;\nssl_ecdh_curve prime256v1;"
    },
    after: {
      lang: "nginx",
      code: "ssl_protocols TLSv1.3 TLSv1.2;\nssl_ecdh_curve X25519MLKEM768:X25519:prime256v1:secp384r1;"
    },
    caveats: "- With OpenSSL < 3.5 nginx refuses to start with an unknown group name. Upgrade the OpenSSL package or base image first.\n- Keep classical groups after the hybrid so older clients can still connect.\n- Verify with `openssl s_client -groups X25519MLKEM768 -connect host:443` or the Q-Day India site checker.",
    references: [
      "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_ecdh_curve",
      "https://github.com/openssl/openssl/releases"
    ],
    markdown: "## Why\n\nAn `ssl_ecdh_curve` list without a post-quantum hybrid, or `ssl_protocols` without TLSv1.3, means every connection uses classical key exchange. That traffic is exposed to harvest-now-decrypt-later.\n\n## Replacement\n\nBuild or install nginx linked against OpenSSL 3.5 or newer (`nginx -V` shows the OpenSSL version), enable TLS 1.3 and put the hybrid group first.\n\n## Before\n\n```nginx\nssl_protocols TLSv1 TLSv1.1 TLSv1.2;\nssl_ecdh_curve prime256v1;\n```\n\n## After\n\n```nginx\nssl_protocols TLSv1.3 TLSv1.2;\nssl_ecdh_curve X25519MLKEM768:X25519:prime256v1:secp384r1;\n```\n\n## Caveats\n\n- With OpenSSL < 3.5 nginx refuses to start with an unknown group name. Upgrade the OpenSSL package or base image first.\n- Keep classical groups after the hybrid so older clients can still connect.\n- Verify with `openssl s_client -groups X25519MLKEM768 -connect host:443` or the Q-Day India site checker.\n\n## References\n\n- https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_ecdh_curve\n- https://github.com/openssl/openssl/releases"
  },
  "tls-openssl-cnf-pq": {
    id: "tls-openssl-cnf-pq",
    title: "openssl.cnf: remove group lists that exclude ML-KEM hybrids",
    verified: "2026-10-21",
    appliesTo: [
      "TLS"
    ],
    why: "A system-wide `Groups` / `Curves` setting in `openssl.cnf` overrides OpenSSL 3.5's default, which already offers X25519MLKEM768 first. A classical-only list silently disables post-quantum key exchange for every application on the host.",
    replacement: "Delete the line to get the OpenSSL 3.5 defaults, or list the hybrid explicitly. Also raise `MinProtocol` to TLSv1.2.",
    before: {
      lang: "ini",
      code: "[system_default_sect]\nMinProtocol = TLSv1\nGroups = P-256:X25519"
    },
    after: {
      lang: "ini",
      code: "[system_default_sect]\nMinProtocol = TLSv1.2\nGroups = X25519MLKEM768:X25519:P-256:P-384"
    },
    caveats: "- Requires OpenSSL \u2265 3.5; older versions reject unknown group names.",
    references: [
      "https://docs.openssl.org/3.5/man3/SSL_CONF_cmd/"
    ],
    markdown: "## Why\n\nA system-wide `Groups` / `Curves` setting in `openssl.cnf` overrides OpenSSL 3.5's default, which already offers X25519MLKEM768 first. A classical-only list silently disables post-quantum key exchange for every application on the host.\n\n## Replacement\n\nDelete the line to get the OpenSSL 3.5 defaults, or list the hybrid explicitly. Also raise `MinProtocol` to TLSv1.2.\n\n## Before\n\n```ini\n[system_default_sect]\nMinProtocol = TLSv1\nGroups = P-256:X25519\n```\n\n## After\n\n```ini\n[system_default_sect]\nMinProtocol = TLSv1.2\nGroups = X25519MLKEM768:X25519:P-256:P-384\n```\n\n## Caveats\n\n- Requires OpenSSL \u2265 3.5; older versions reject unknown group names.\n\n## References\n\n- https://docs.openssl.org/3.5/man3/SSL_CONF_cmd/"
  }
};

// src/rules.ts
var RULES = rules_default;
var FIXES = fixes_default;
var getFix = (id) => id ? FIXES[id] : void 0;

// src/engine.ts
var ENGINE_VERSION = "1.0.0";
var TOOL_NAME = "QuantumBOM (Q-Day India)";
var GRAMMAR_FILE = {
  python: "tree-sitter-python.wasm",
  javascript: "tree-sitter-javascript.wasm",
  typescript: "tree-sitter-typescript.wasm",
  tsx: "tree-sitter-tsx.wasm",
  java: "tree-sitter-java.wasm",
  go: "tree-sitter-go.wasm"
};
function redact(s) {
  return s.replace(/-----BEGIN [A-Z ]+-----[\s\S]*?(-----END [A-Z ]+-----|$)/g, "-----BEGIN \u2026----- [redacted]").replace(/[A-Za-z0-9+/=_-]{48,}/g, "[redacted]");
}
function snippetFor(lines, startRow, endRow) {
  return redact(
    lines.slice(startRow, Math.min(endRow, startRow + 2) + 1).map((l) => (l.length > 200 ? l.slice(0, 200) + "\u2026" : l).replace(/\s+$/, "")).join("\n")
  );
}
function parseKeySize(v) {
  if (!v) return void 0;
  const m = /(\d{2,5})/.exec(v);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n >= 64 && n <= 16384 ? n : void 0;
}
function pickVariant(rule, value) {
  if (!rule.variants) return void 0;
  if (value === void 0) return null;
  return rule.variants.find((v) => re(v.match).test(value)) ?? null;
}
var Engine = class _Engine {
  constructor(opts, rules) {
    this.opts = opts;
    this.rules = rules;
    for (const r of rules) {
      if (r.kind === "treesitter")
        for (const l of r.language ?? []) this.treeRules.set(l, [...this.treeRules.get(l) ?? [], r]);
      else if (r.kind === "regex")
        this.regexRules.push({
          rule: r,
          globs: (r.files ?? ["*"]).map(globToRegExp),
          re: new RegExp(r.pattern, (r.flags ?? "i").replace("g", "") + "g")
        });
      else if (r.kind === "manifest") this.manifestRules.push(r);
    }
  }
  opts;
  langs = /* @__PURE__ */ new Map();
  parser;
  treeRules = /* @__PURE__ */ new Map();
  regexRules = [];
  manifestRules = [];
  rules;
  static async create(opts) {
    const runtime = await opts.locateWasm("web-tree-sitter.wasm");
    await Parser.init(
      typeof runtime === "string" ? { locateFile: () => runtime } : { wasmBinary: runtime }
    );
    const e = new _Engine(opts, opts.rules ?? RULES);
    e.parser = new Parser();
    return e;
  }
  async language(l) {
    let lang = this.langs.get(l);
    if (!lang) {
      lang = await Language.load(await this.opts.locateWasm(GRAMMAR_FILE[l]));
      this.langs.set(l, lang);
    }
    return lang;
  }
  /** Compiles every raw query for every language it targets; returns error messages. */
  async validateQueries() {
    const errors = [];
    for (const [l, rules] of this.treeRules) {
      const lang = await this.language(l);
      for (const r of rules.filter((x) => x.query)) {
        try {
          getQuery(lang, l, r.query);
        } catch (e) {
          errors.push(`${r.id} (${l}): ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
    return errors;
  }
  /** Cheap name-based check: is this path worth downloading/reading? */
  isRelevant(path) {
    const p = normalizePath(path);
    if (pathSkipReason(p)) return false;
    const c = classify(p);
    if (c && c.kind !== "config") return true;
    return this.regexRules.some((r) => matchesGlobs(p, r.globs, r.rule.files ?? ["*"]));
  }
  /** Analyses one file. Returns findings sorted by position. */
  async scanFile(file) {
    const path = normalizePath(file.path);
    const text = file.content.replace(/\r\n?/g, "\n");
    const lines = text.split("\n");
    const c = classify(path);
    const out3 = [];
    if (c?.kind === "tree") out3.push(...await this.scanTree(path, text, lines, c.language));
    if (c?.kind === "manifest") out3.push(...this.scanManifest(path, text));
    out3.push(...this.scanRegex(path, text, lines));
    if (c?.kind === "key" || text.includes("-----BEGIN ") || /(?:^|\s)(ssh-rsa|ssh-ed25519|ssh-dss|ecdsa-sha2-nistp\d+) AAAA/.test(text))
      out3.push(...scanKeyMaterial(path, text));
    const seen = /* @__PURE__ */ new Set();
    return out3.filter((f) => {
      const k = `${f.ruleId}:${f.line}:${f.column}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => a.line - b.line || a.column - b.column || a.ruleId.localeCompare(b.ruleId));
  }
  finding(rule, variant, file, node, snippet, keySize, parameter) {
    const v = variant ?? {};
    return {
      ruleId: rule.id,
      file,
      line: node.row + 1,
      column: node.col + 1,
      snippet,
      algorithm: v.algorithm ?? rule.algorithm,
      keySize: v.key_size ?? keySize,
      primitive: v.primitive ?? rule.primitive,
      quantumRisk: v.quantum_risk ?? rule.quantum_risk,
      confidence: v.confidence ?? rule.confidence,
      fixId: v.fix ?? rule.fix,
      message: v.message ?? rule.message,
      assetType: v.asset_type ?? rule.asset_type ?? "algorithm",
      kind: rule.kind,
      parameter: v.parameter ?? parameter
    };
  }
  async scanTree(path, text, lines, l) {
    const rules = this.treeRules.get(l) ?? [];
    if (rules.length === 0) return [];
    const lang = await this.language(l);
    this.parser.setLanguage(lang);
    const tree = this.parser.parse(text);
    if (!tree) return [];
    const out3 = [];
    const at = (n) => ({ row: n.startPosition.row, col: n.startPosition.column });
    try {
      const callRules = rules.filter((r) => !r.query);
      if (callRules.length) {
        for (const site of extractCalls(tree, lang, l)) {
          for (const rule of callRules) {
            if (!callMatches(rule, site)) continue;
            const variant = pickVariant(rule, fromCall(site, rule.variant_from ?? (rule.variants ? "arg0" : void 0)));
            if (variant === null || variant?.skip) continue;
            out3.push(
              this.finding(
                rule,
                variant,
                path,
                at(site.node),
                snippetFor(lines, site.node.startPosition.row, site.node.endPosition.row),
                parseKeySize(fromCall(site, rule.key_size)),
                fromCall(site, rule.parameter)
              )
            );
          }
        }
      }
      for (const rule of rules.filter((r) => r.query)) {
        for (const hit of queryHits(rule, tree, lang, l)) {
          const variant = pickVariant(rule, hit.value);
          if (variant === null || variant?.skip) continue;
          out3.push(
            this.finding(rule, variant, path, at(hit.node), snippetFor(lines, hit.node.startPosition.row, hit.node.endPosition.row), parseKeySize(hit.keySizeText))
          );
        }
      }
    } finally {
      tree.delete();
    }
    return out3;
  }
  scanRegex(path, text, lines) {
    const out3 = [];
    const prefixes = commentPrefixes(path);
    let lineStarts = null;
    for (const { rule, globs, re: rx } of this.regexRules) {
      if (!matchesGlobs(path, globs, rule.files ?? ["*"])) continue;
      rx.lastIndex = 0;
      for (const m of text.matchAll(rx)) {
        if (!lineStarts) {
          lineStarts = [0];
          for (let i2 = 0; i2 < text.length; i2++) if (text[i2] === "\n") lineStarts.push(i2 + 1);
        }
        const idx = m.index;
        let row = 0;
        for (let lo = 0, hi = lineStarts.length - 1; lo <= hi; ) {
          const mid = lo + hi >> 1;
          if (lineStarts[mid] <= idx) {
            row = mid;
            lo = mid + 1;
          } else hi = mid - 1;
        }
        const lineText = lines[row] ?? "";
        if (prefixes.some((p) => lineText.trimStart().startsWith(p))) continue;
        const group = (spec) => {
          if (!spec) return void 0;
          if (spec === "match") return m[0];
          if (spec.startsWith("group:")) return m.groups?.[spec.slice(6)];
          return void 0;
        };
        const variant = pickVariant(rule, group(rule.variant_from ?? (rule.variants ? "group:alg" : void 0)));
        if (variant === null || variant?.skip) continue;
        const endRow = row + (m[0].match(/\n/g)?.length ?? 0);
        out3.push(this.finding(rule, variant, path, { row, col: idx - lineStarts[row] }, snippetFor(lines, row, endRow), parseKeySize(group(rule.key_size)), group(rule.parameter)));
      }
    }
    return out3;
  }
  scanManifest(path, text) {
    const deps = extractDependencies(path, text);
    const out3 = [];
    const lines = text.split("\n");
    for (const rule of this.manifestRules) {
      for (const lib of rule.libraries ?? []) {
        for (const d of deps) {
          if (lib.ecosystem !== "any" && lib.ecosystem !== d.ecosystem) continue;
          if (!re(`^(?:${lib.name})$`).test(d.name)) continue;
          if (lib.version_below && !versionBelow(d.version, lib.version_below)) continue;
          out3.push({
            ruleId: rule.id,
            file: path,
            line: d.line,
            column: 1,
            snippet: snippetFor(lines, d.line - 1, d.line - 1).trim(),
            algorithm: lib.algorithm,
            primitive: lib.primitive,
            quantumRisk: lib.quantum_risk,
            confidence: lib.confidence ?? rule.confidence,
            fixId: lib.fix ?? rule.fix,
            message: lib.message.replace("{version}", d.version ?? "unspecified").replace("{name}", d.name),
            assetType: "algorithm",
            kind: "manifest",
            details: { dependency: d.name, ...d.version ? { version: d.version } : {} }
          });
        }
      }
    }
    return out3;
  }
  /** Scans a stream of files, enforcing limits, and returns the full report. */
  async scan(files, o) {
    const started = Date.now();
    const maxFiles = o.maxFiles ?? MAX_FILES;
    const excludes = (o.exclude ?? []).map((g) => globToRegExp(g.includes("/") || g.startsWith("**") ? g : `**/${g}`));
    const stats = { filesSeen: 0, filesScanned: 0, skipped: {}, bytesScanned: 0, durationMs: 0, byLanguage: {} };
    const findings = [];
    const warnings = [];
    const skip = (r) => stats.skipped[r] = (stats.skipped[r] ?? 0) + 1;
    for await (const f of files) {
      stats.filesSeen++;
      const path = normalizePath(f.path);
      if (excludes.some((x) => x.test(path))) {
        skip("excluded-dir");
        continue;
      }
      const pre = pathSkipReason(path);
      if (pre || !this.isRelevant(path)) {
        skip(pre ?? "irrelevant");
        continue;
      }
      const post = contentSkipReason(path, f.content);
      if (post) {
        skip(post);
        continue;
      }
      if (stats.filesScanned >= maxFiles) {
        skip("cap");
        continue;
      }
      stats.filesScanned++;
      stats.bytesScanned += f.content.length;
      const c = classify(path);
      const langKey = c?.kind === "tree" || c?.kind === "regex-source" ? c.language : c?.kind ?? "other";
      stats.byLanguage[langKey] = (stats.byLanguage[langKey] ?? 0) + 1;
      try {
        const fs2 = await this.scanFile({ path, content: f.content });
        if (fs2.length) {
          findings.push(...fs2);
          o.onFindings?.(fs2, path);
        }
      } catch (err2) {
        warnings.push(`Could not analyse ${path}: ${err2 instanceof Error ? err2.message : String(err2)}`);
      }
      o.onProgress?.({ filesDone: stats.filesScanned, filesTotal: o.filesTotal, findings: findings.length, current: path });
    }
    if (stats.skipped.cap) warnings.push(`Only the first ${maxFiles} relevant files were analysed; ${stats.skipped.cap} more were skipped.`);
    stats.durationMs = Date.now() - started;
    findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
    return {
      tool: { name: TOOL_NAME, version: ENGINE_VERSION },
      scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: o.source,
      stats,
      findings,
      scores: computeScores(findings, stats.filesScanned),
      warnings
    };
  }
};
var createEngine = (opts) => Engine.create(opts);

// src/node.ts
var require2 = createRequire(import.meta.url);
function nodeWasmLocator(wasmDir) {
  return async (file) => {
    const spec = WASM_FILES[file];
    if (!wasmDir && !spec) throw new Error(`unknown WASM file ${file}`);
    const path = wasmDir ? join(wasmDir, file) : require2.resolve(spec);
    return new Uint8Array(await readFile(path));
  };
}
var createNodeEngine = (wasmDir) => createEngine({ locateWasm: nodeWasmLocator(wasmDir) });
async function* walk(root, engine) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(dir, e.name);
      const rel = relative(root, full).split(sep).join("/");
      if (e.isDirectory()) {
        if (pathSkipReason(`${rel}/x.js`) !== "excluded-dir") stack.push(full);
        continue;
      }
      if (!e.isFile()) continue;
      if (engine && !engine.isRelevant(rel)) {
        yield { path: rel, content: "" };
        continue;
      }
      const s = await stat(full);
      if (s.size > 512 * 1024) {
        yield { path: rel, content: "x".repeat(512 * 1024 + 1) };
        continue;
      }
      yield { path: rel, content: await readFile(full, "utf8") };
    }
  }
}

// src/algorithms.ts
var META = [
  [/^ML-KEM-512/i, () => ({ nist: 1, oid: "2.16.840.1.101.3.4.4.1" })],
  [/^ML-KEM-768/i, () => ({ nist: 3, oid: "2.16.840.1.101.3.4.4.2" })],
  [/^ML-KEM-1024/i, () => ({ nist: 5, oid: "2.16.840.1.101.3.4.4.3" })],
  [/^ML-DSA-44/i, () => ({ nist: 2, oid: "2.16.840.1.101.3.4.3.17" })],
  [/^ML-DSA-65/i, () => ({ nist: 3, oid: "2.16.840.1.101.3.4.3.18" })],
  [/^ML-DSA-87/i, () => ({ nist: 5, oid: "2.16.840.1.101.3.4.3.19" })],
  [/^X25519MLKEM768|hybrid/i, () => ({ nist: 3 })],
  [/^RSA/i, (b) => ({ nist: 0, classical: b ? b >= 15360 ? 256 : b >= 7680 ? 192 : b >= 3072 ? 128 : b >= 2048 ? 112 : 80 : void 0, oid: "1.2.840.113549.1.1.1" })],
  [/^(ECDSA|ECDH|ECC|EC\b|EC$)/i, (b) => ({ nist: 0, classical: b ? Math.floor(b / 2) : void 0, oid: "1.2.840.10045.2.1" })],
  [/^Ed25519/i, () => ({ nist: 0, classical: 128, oid: "1.3.101.112" })],
  [/^Ed448/i, () => ({ nist: 0, classical: 224, oid: "1.3.101.113" })],
  [/^X25519/i, () => ({ nist: 0, classical: 128, oid: "1.3.101.110" })],
  [/^X448/i, () => ({ nist: 0, classical: 224, oid: "1.3.101.111" })],
  [/^(DH|FFDH|Diffie)/i, () => ({ nist: 0, oid: "1.2.840.113549.1.3.1" })],
  [/^DSA/i, () => ({ nist: 0, oid: "1.2.840.10040.4.1" })],
  [/^MD5/i, () => ({ nist: 0, classical: 0, oid: "1.2.840.113549.2.5" })],
  [/^SHA-?1\b/i, () => ({ nist: 0, classical: 0, oid: "1.3.14.3.2.26" })],
  [/^(3DES|TDEA|DESede|Triple)/i, () => ({ nist: 0, classical: 112 })],
  [/^DES/i, () => ({ nist: 0, classical: 56 })],
  [/^RC4/i, () => ({ nist: 0, classical: 0 })],
  [/^AES-?128/i, () => ({ nist: 1, classical: 128 })],
  [/^AES-?192/i, () => ({ nist: 3, classical: 192 })],
  [/^AES-?256/i, () => ({ nist: 5, classical: 256 })],
  [/^SHA-?256|^SHA3-256/i, () => ({ nist: 2, classical: 128 })],
  [/^SHA-?384|^SHA3-384/i, () => ({ nist: 4, classical: 192 })],
  [/^SHA-?512|^SHA3-512/i, () => ({ nist: 5, classical: 256 })]
];
function algorithmMeta(algorithm, bits) {
  for (const [re2, f] of META) if (re2.test(algorithm)) return f(bits);
  return {};
}
function assetName(f) {
  let name2 = f.algorithm;
  if (f.keySize && !/\d{3,}/.test(name2) && /^(RSA|DSA|DH|AES)/i.test(name2)) name2 = `${name2}-${f.keySize}`;
  if (f.parameter && !name2.includes(f.parameter)) name2 = `${name2} ${f.parameter}`;
  return name2;
}
var CDX_PRIMITIVE = {
  pke: "pke",
  signature: "signature",
  kem: "kem",
  "key-agreement": "key-agree",
  hash: "hash",
  symmetric: "block-cipher",
  mac: "mac",
  kdf: "kdf",
  rng: "drbg"
};
var CRYPTO_FUNCTIONS = {
  pke: ["keygen", "encrypt", "decrypt"],
  signature: ["keygen", "sign", "verify"],
  kem: ["keygen", "encapsulate", "decapsulate"],
  "key-agreement": ["keygen", "keyderive"],
  hash: ["digest"],
  symmetric: ["encrypt", "decrypt"],
  mac: ["tag"],
  kdf: ["keyderive"],
  rng: ["generate"]
};

// src/export/cyclonedx.ts
function uuid(seed) {
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i2 = 0; i2 < seed.length; i2++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i2), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i2), 2246822519) >>> 0;
  }
  const hex = (n) => n.toString(16).padStart(8, "0");
  const s = hex(h1) + hex(h2) + hex(h1 ^ h2) + hex(h1 * 31 + h2 >>> 0);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20, 32)}`;
}
var RISK_ORDER = { HIGH: 0, CLASSICAL_BROKEN: 1, LOW: 2, NONE: 3 };
function groupKey(f) {
  if (f.assetType === "certificate") return `cert|${f.file}|${f.line}`;
  if (f.assetType === "related-crypto-material") return `rcm|${f.file}|${f.line}`;
  if (f.assetType === "protocol") return `proto|${f.algorithm}|${f.parameter ?? ""}`;
  return `alg|${assetName(f)}|${f.primitive}`;
}
function toCycloneDX(report) {
  const groups = /* @__PURE__ */ new Map();
  for (const f of report.findings) {
    const k = groupKey(f);
    groups.set(k, [...groups.get(k) ?? [], f]);
  }
  const components = [];
  let i2 = 0;
  for (const fs2 of groups.values()) {
    const f = [...fs2].sort((a, b) => RISK_ORDER[a.quantumRisk] - RISK_ORDER[b.quantumRisk])[0];
    const ref = `crypto-${++i2}`;
    const meta = algorithmMeta(f.algorithm, f.keySize);
    let name2 = assetName(f);
    const crypto = { assetType: f.assetType };
    if (f.assetType === "certificate") {
      name2 = `X.509 certificate (${assetName(f)})${f.details?.subject ? ` ${f.details.subject}` : ""}`;
      crypto.certificateProperties = {
        ...f.details?.subject ? { subjectName: f.details.subject } : {},
        ...f.details?.issuer ? { issuerName: f.details.issuer } : {},
        ...f.details?.notBefore ? { notValidBefore: f.details.notBefore } : {},
        ...f.details?.notAfter ? { notValidAfter: f.details.notAfter } : {},
        certificateFormat: "X.509"
      };
    } else if (f.assetType === "related-crypto-material") {
      const type = f.details?.materialType === "private-key" ? "private-key" : f.details?.materialType === "public-key" ? "public-key" : "key";
      name2 = `${assetName(f)} ${type.replace("-", " ")}`;
      crypto.relatedCryptoMaterialProperties = { type, ...f.keySize ? { size: f.keySize } : {} };
    } else if (f.assetType === "protocol") {
      crypto.protocolProperties = { type: /ssh/i.test(f.algorithm) ? "ssh" : "tls", ...f.parameter ? { version: f.parameter } : {} };
    } else {
      crypto.algorithmProperties = {
        primitive: /RC4/i.test(f.algorithm) ? "stream-cipher" : CDX_PRIMITIVE[f.primitive],
        ...f.keySize ? { parameterSetIdentifier: String(f.keySize) } : f.parameter ? { parameterSetIdentifier: f.parameter } : {},
        ...f.parameter && /^(P-|secp|prime|curve|brainpool)/i.test(f.parameter) ? { curve: f.parameter } : {},
        cryptoFunctions: CRYPTO_FUNCTIONS[f.primitive],
        ...meta.classical !== void 0 ? { classicalSecurityLevel: meta.classical } : {},
        ...meta.nist !== void 0 ? { nistQuantumSecurityLevel: meta.nist } : {}
      };
      if (meta.oid) crypto.oid = meta.oid;
    }
    const fix = getFix(f.fixId);
    components.push({
      type: "cryptographic-asset",
      "bom-ref": ref,
      name: name2,
      description: f.message,
      cryptoProperties: crypto,
      evidence: {
        occurrences: fs2.map((o) => ({
          location: o.file,
          line: o.line,
          offset: Math.max(0, o.column - 1),
          additionalContext: `${o.ruleId} (confidence: ${o.confidence})`
        }))
      },
      properties: [
        { name: "qday:quantumRisk", value: f.quantumRisk },
        { name: "qday:confidence", value: f.confidence },
        { name: "qday:rules", value: [...new Set(fs2.map((o) => o.ruleId))].join(",") },
        ...fix ? [{ name: "qday:fix", value: `${fix.id}: ${fix.title}` }] : []
      ]
    });
  }
  return {
    $schema: "http://cyclonedx.org/schema/bom-1.6.schema.json",
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:uuid:${uuid(report.scannedAt + report.source.name + report.findings.length)}`,
    version: 1,
    metadata: {
      timestamp: report.scannedAt,
      tools: { components: [{ type: "application", name: report.tool.name, version: report.tool.version }] },
      component: {
        type: "application",
        "bom-ref": "scanned-source",
        name: report.source.name,
        ...report.source.ref ? { version: report.source.ref } : {}
      },
      properties: [
        { name: "qday:quantumExposure", value: String(report.scores.exposure) },
        { name: "qday:cryptoAgility", value: String(report.scores.agility) },
        { name: "qday:filesScanned", value: String(report.stats.filesScanned) }
      ]
    },
    components
  };
}

// src/export/sarif.ts
var LEVEL = {
  HIGH: "warning",
  CLASSICAL_BROKEN: "error",
  LOW: "note",
  NONE: "none"
};
var SEVERITY = { HIGH: "6.0", CLASSICAL_BROKEN: "7.0", LOW: "3.0", NONE: "0.0" };
var RISK_TEXT = {
  HIGH: "not quantum-safe (breakable by Shor\u2019s algorithm on a future quantum computer); migration recommended",
  CLASSICAL_BROKEN: "already weak against classical attacks; replace now",
  LOW: "weakened by Grover\u2019s algorithm; a larger key size is recommended",
  NONE: "informational: no quantum risk"
};
var BUILTIN = {
  "pem-certificate": "X.509 certificate with a classical (RSA/ECDSA) key",
  "pem-private-key": "Private key committed to the repository",
  "pem-public-key": "Classical public key file",
  "ssh-public-key": "Classical SSH public key",
  "pem-unparsed": "Undecodable PEM block"
};
function toSARIF(report, uriBase = "%SRCROOT%") {
  const ids = [...new Set(report.findings.map((f) => f.ruleId))].sort();
  const worst = /* @__PURE__ */ new Map();
  for (const f of report.findings) if (!worst.has(f.ruleId)) worst.set(f.ruleId, f);
  const rules = ids.map((id) => {
    const r = RULES.find((x) => x.id === id);
    const sample = worst.get(id);
    const fix = getFix(sample.fixId ?? r?.fix);
    const short = r?.message ?? BUILTIN[id] ?? id;
    return {
      id,
      name: id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()),
      shortDescription: { text: short.length > 120 ? short.slice(0, 117) + "\u2026" : short },
      fullDescription: { text: short },
      help: {
        text: fix ? `${fix.title}

${fix.why}

${fix.replacement}` : RISK_TEXT[sample.quantumRisk],
        markdown: fix ? fix.markdown : RISK_TEXT[sample.quantumRisk]
      },
      defaultConfiguration: { level: LEVEL[sample.quantumRisk] },
      properties: {
        tags: ["security", "cryptography", "post-quantum", sample.primitive],
        "security-severity": SEVERITY[sample.quantumRisk],
        precision: sample.confidence === "high" ? "high" : sample.confidence === "medium" ? "medium" : "low"
      }
    };
  });
  const results = report.findings.map((f) => ({
    ruleId: f.ruleId,
    ruleIndex: ids.indexOf(f.ruleId),
    level: LEVEL[f.quantumRisk],
    message: { text: `${assetName(f)} (${f.primitive}): ${f.message} \u2014 ${RISK_TEXT[f.quantumRisk]}.` },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.file, uriBaseId: uriBase },
          region: { startLine: f.line, startColumn: f.column, snippet: { text: f.snippet } }
        }
      }
    ],
    partialFingerprints: { "qdayFinding/v1": `${f.ruleId}:${f.file}:${f.snippet.split("\n")[0].trim()}` },
    properties: { algorithm: f.algorithm, quantumRisk: f.quantumRisk, confidence: f.confidence, ...f.keySize ? { keySize: f.keySize } : {} }
  }));
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "QuantumBOM",
            fullName: report.tool.name,
            version: report.tool.version,
            semanticVersion: report.tool.version,
            informationUri: "https://qday-india.vercel.app/code",
            rules
          }
        },
        originalUriBaseIds: { [uriBase]: { description: { text: "Repository root" } } },
        results,
        properties: { quantumExposure: report.scores.exposure, cryptoAgility: report.scores.agility }
      }
    ]
  };
}

// src/export/markdown.ts
var HEADINGS = {
  HIGH: "Not quantum-safe (Shor) \u2014 migration recommended",
  CLASSICAL_BROKEN: "Already weak today \u2014 replace now",
  LOW: "Weakened by Grover \u2014 increase key size",
  NONE: "Informational"
};
var ORDER = ["HIGH", "CLASSICAL_BROKEN", "LOW", "NONE"];
var fence = (code) => {
  const ticks = code.includes("```") ? "````" : "```";
  return `${ticks}
${code}
${ticks}`;
};
function toMarkdown(report) {
  const out3 = [];
  const date = report.scannedAt.slice(0, 10);
  out3.push(`# QuantumBOM report \u2014 ${report.source.name}`);
  out3.push("");
  out3.push(
    `Scanned ${date} with ${report.tool.name} ${report.tool.version}. ${report.stats.filesScanned} files analysed, ${report.findings.length} findings.`
  );
  out3.push("");
  out3.push("## Scores");
  out3.push("");
  out3.push(`| Score | Value |
|---|---|
| Quantum Exposure | **${report.scores.exposure}/100** |
| Crypto-Agility | **${report.scores.agility}/100** |`);
  out3.push("");
  out3.push("<details><summary>Score inputs</summary>\n");
  for (const i2 of [...report.scores.exposureInputs, ...report.scores.agilityInputs]) out3.push(`- ${i2.label}: ${i2.value}`);
  out3.push("\n</details>");
  out3.push("");
  out3.push("## Summary");
  out3.push("");
  out3.push("| Risk | Findings |\n|---|---|");
  for (const r of ORDER) out3.push(`| ${HEADINGS[r]} | ${report.findings.filter((f) => f.quantumRisk === r).length} |`);
  out3.push("");
  const fixIds = /* @__PURE__ */ new Set();
  for (const r of ORDER) {
    const fs2 = report.findings.filter((f) => f.quantumRisk === r);
    if (!fs2.length) continue;
    out3.push(`## ${HEADINGS[r]}`);
    out3.push("");
    const byFile = /* @__PURE__ */ new Map();
    for (const f of fs2) byFile.set(f.file, [...byFile.get(f.file) ?? [], f]);
    for (const [file, list] of byFile) {
      out3.push(`### \`${file}\``);
      out3.push("");
      for (const f of list) {
        const fix = getFix(f.fixId);
        if (fix) fixIds.add(fix.id);
        out3.push(`- **Line ${f.line}** \u2014 ${assetName(f)} (${f.primitive}, confidence ${f.confidence}): ${f.message}${fix ? ` Fix: [${fix.title}](#fix-${fix.id})` : ""}`);
        out3.push("");
        out3.push(fence(f.snippet).replace(/^/gm, "  "));
        out3.push("");
      }
    }
  }
  if (fixIds.size) {
    out3.push("## Fixes");
    out3.push("");
    for (const id of fixIds) {
      const fix = getFix(id);
      out3.push(`### <a id="fix-${fix.id}"></a>${fix.title}`);
      out3.push("");
      out3.push(`_Last verified ${fix.verified}._`);
      out3.push("");
      out3.push(fix.markdown.trim());
      out3.push("");
    }
  }
  if (report.warnings.length) {
    out3.push("## Warnings");
    out3.push("");
    for (const w of report.warnings) out3.push(`- ${w}`);
    out3.push("");
  }
  out3.push("---");
  out3.push("Static analysis has false positives and misses algorithms chosen at runtime; confidence levels are shown per finding. Generated by Q-Day India QuantumBOM \u2014 the code never left the machine it was scanned on.");
  return out3.join("\n") + "\n";
}

// src/cli.ts
function parseArgs(argv) {
  const a = { dir: ".", exclude: [], quiet: false };
  const rest = [...argv];
  if (rest[0] === "scan") rest.shift();
  while (rest.length) {
    const t = rest.shift();
    const val = () => {
      const v = rest.shift();
      if (v === void 0) throw new Error(`${t} needs a value`);
      return v;
    };
    switch (t) {
      case "--cbom":
        a.cbom = val();
        break;
      case "--sarif":
        a.sarif = val();
        break;
      case "--md":
        a.md = val();
        break;
      case "--json":
        a.json = val();
        break;
      case "--exclude":
        a.exclude.push(...val().split(",").map((s) => s.trim()).filter(Boolean));
        break;
      case "--fail-above":
        a.failAbove = Number(val());
        break;
      case "--name":
        a.name = val();
        break;
      case "--quiet":
        a.quiet = true;
        break;
      case "-h":
      case "--help":
        throw new Error("usage");
      default:
        if (t.startsWith("-")) throw new Error(`unknown option ${t}`);
        a.dir = t;
    }
  }
  return a;
}
async function out2(path, data) {
  if (!path) return;
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(path, data);
}
function summary(r) {
  const by = (risk2) => r.findings.filter((f) => f.quantumRisk === risk2).length;
  return [
    `QuantumBOM \u2014 ${r.source.name}`,
    `  files analysed:     ${r.stats.filesScanned} (${r.stats.filesSeen} seen) in ${r.stats.durationMs} ms`,
    `  findings:           ${r.findings.length} (HIGH ${by("HIGH")}, classically weak ${by("CLASSICAL_BROKEN")}, LOW ${by("LOW")}, info ${by("NONE")})`,
    `  Quantum Exposure:   ${r.scores.exposure}/100`,
    `  Crypto-Agility:     ${r.scores.agility}/100`,
    ...r.warnings.map((w) => `  warning: ${w}`)
  ].join("\n");
}
async function main(argv) {
  let a;
  try {
    a = parseArgs(argv);
  } catch (e) {
    console.error(
      `${e instanceof Error && e.message !== "usage" ? `error: ${e.message}
` : ""}usage: quantumbom scan [dir] [--cbom file] [--sarif file] [--md file] [--json file] [--exclude glob[,glob]] [--fail-above N] [--name name]`
    );
    return 2;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const bundledWasm = join2(here, "wasm");
  const engine = await createNodeEngine(existsSync(bundledWasm) ? bundledWasm : void 0);
  const root = resolve(a.dir);
  const report = await engine.scan(walk(root, engine), {
    source: { kind: "local", name: a.name ?? root.split(/[\\/]/).pop() ?? "repository" },
    exclude: a.exclude
  });
  await out2(a.cbom, JSON.stringify(toCycloneDX(report), null, 2));
  await out2(a.sarif, JSON.stringify(toSARIF(report), null, 2));
  await out2(a.md, toMarkdown(report));
  await out2(a.json, JSON.stringify(report, null, 2));
  if (!a.quiet) console.log(summary(report));
  if (a.failAbove !== void 0 && report.scores.exposure > a.failAbove) {
    console.error(`Quantum Exposure ${report.scores.exposure} is above the threshold ${a.failAbove}.`);
    return 1;
  }
  return 0;
}
var invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main(process.argv.slice(2)).then((code) => process.exit(code));
export {
  main,
  parseArgs,
  summary
};
