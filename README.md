# Obsidian Chess Plugin

A chess game viewer and editor for [Obsidian](https://obsidian.md/).

## Features

This plugin is a fork of the great [Chesser](https://github.com/SilentVoid13/Chesser) plugin but somewhat simplified and with the following features added:

- PGN support
- Move annotations
- Keyboard shortcuts
- `chess-pgn` and `chess-fen` codeblock syntax
- Board resizibility
- Toggle sidebar visibility
- Chessboard coordinates
- Better sidebar UI
- Context menu
- Mobile support

## Usage

The easiest way to use this plugin is to simply paste the PGN in `chess-pgn` codeblock:

````
```chess-pgn
1. e4 e5 
2. Nf3 Nc6 
3. Bc4 Bc5 
4. b4 Bxb4 
5. c3 Ba5 
6. d4 exd4 
7. O-O d3 
8. Qb3 Qf6 
9. e5 Qg6 
10. Re1 Nge7 
11. Ba3 b5 
12. Qxb5 Rb8 
13. Qa4 Bb6 
14. Nbd2 Bb7 
15. Ne4 Qf5 
16. Bxd3 Qh5 
17. Nf6+ gxf6 
18. exf6 Rg8 
19. Rad1 Qxf3 
20. Rxe7+ Nxe7 
21. Qxd7+ Kxd7 
22. Bf5+ Ke8 
23. Bd7+ Kf8 
24. Bxe7# 
```
````

This plugin supports move annotations using glyphs, so moves notated with the following glyphs will display appropriate annotation icons on the board:

- `!!` for brilliant
- `!` for Great
- `?` for Mistake
- `?!` for Dubious
- `!?` for Interesting
- `??` for Blunder

If you want to use FEN, you can use the `chess-fen` codeblock:

`````
```chess-fen
rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2
```
`````

If you want to add codeblock-specific configuration, you can declare a `chess` code block like so:

````
```chess
insert configuration here
```
````

The following configuration options are available:

| Name          | Possible Values                                              | Description                                                  |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `fen`         | A valid FEN string                                           | Starts the chess board with a particular position.           |
| `pgn`         | A valid PGN string formatted for YAML                        | Loads the chess board with the moves from a PGN game         |
| `interactability`    | `true`/`false`                                               | Toggle whether chess board is interactable. |
| `pieceStyle`  | A valid piece style name.<br />Check [this](https://github.com/dsynkd/obsidian-chess/tree/master/assets/piece-css) to view available styles. | Style of the pieces on the board.                            |
| `boardStyle`  | A valid board style name.<br />Check [this](https://github.com/dsynkd/obsidian-chess/tree/master/assets/board-css) to view available styles. | Style of the chess board.                                    |
| `orientation` | `white`/`black`                                              | Orientation of the board.                                    |
| `showSidebar`    | `true`/`false`                                               | Toggle sidebar visibility.     |
| `showToolbar`    | `true`/`false`                                               | Toggle toolbar visibility.     |
| `enableSounds`   | `true`/`false`                                               | Toggle move sounds.           |
| `showAnnotations`    | `true`/`false`                                               | Toggle annotation icons.     |
| `enableCoordinates`  | `true`/`false`                                           | Toggle chessboard coordinates. |
| `startingMoveIndex`    | Non-negative integer                                               | The index of the move the board should start on initial render.     |

PGN must be properly formatted as a multiline YAML string (pipe to indicate multiline and 2 or 4 spaces for indent):

````
```chess
pgn: |
  1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. d4 d6
  7. Nd3 Nxe4 8. Bxf4 Bg7 9. Nc3! Nxc3 10. bxc3 10... c5
  11. Be2 cxd4 12. O-O Nc6 13. Bxg4 O-O 14. Bxc8 Rxc8 15. Qg4 f5
  16. Qg3 dxc3 17. Rae1 Kh8 18. Kh1 Rg8 19. Bxd6 Bf8 20. Be5+
  Nxe5 21. Qxe5+ Rg7 22. Rxf5 Qxh4+ 23. Kg1 Qg4 24. Rf2 Be7
  25. Re4 Qg5 26. Qd4 Rf8 27. Re5 Rd8 28. Qe4 Qh4 29. Rf4 1-0
```
````

## Toolbar

The toolbar is a UI component that contains the following buttons:

- Next Move
- Previous Move
- Reset Board
- Flip Orientation
- Toggle Sidebar

## Keyboard Shortcuts

When the chess view is focused, you can use left and right arrow keys for Previous Move and Next move commands.

You can also use a hotkey for toggling the sidebar, which is configurable in the Obsidian hotkeys for this plugin.

## Context Menu

You can right click anywhere on the chess view to access the context menu. The context menu contains the same commands as the ones
available in the toolbar, in addition to the following commands:

- Copy FEN
- Copy PGN

## Snippets

This plugin comes with a few CSS classes you can use in your snippets to further customize the style.

Move annotations in the sidebar have the following CSS classes:

- `chess-move-annotation-brilliant`
- `chess-move-annotation-great`
- `chess-move-annotation-mistake`
- `chess-move-annotation-inaccuracy`
- `chess-move-annotation-blunder`
- `chess-move-annotation-checkmate`

Additionally, you can use the following CSS classes in the `cssclasses` frontmatter property to control board alignment when the sidebar is hidden (overrides config). 

- `chess-board-align-leading` (Default)
- `chess-board-align-middle`
- `chess-board-align-trailing`

## License


[Obsidian Chess Plugin](https://github.com/dsynkd/obsidian-chess) is licensed under the GNU AGPLv3 license. Refer to [LICENSE](https://github.com/dsynkd/obsidian-chess/blob/master/LICENSE.TXT) for more informations.