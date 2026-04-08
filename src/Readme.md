mac finder 自作Webアプリからジャンプ 独自URLスキーム

自作のWebアプリからMacのFinderを特定のフォルダで開かせるには、**カスタムURLスキーム（独自URLスキーム）**を利用するのが最もスムーズな方法です。

ブラウザのセキュリティ制限（サンドボックス）により、通常の file:// リンクはWebサイトから直接実行できませんが、macOSの「ショートカット」アプリや自作のラッパーアプリを介することで、この制限を回避してFinderを操作できます。

1. 最も簡単な方法：macOS「ショートカット」の活用
   macOS標準の「ショートカット」アプリを使うと、追加のプログラミングなしでURLスキームを作成できます。

設定手順
ショートカットの作成: 「ショートカット」アプリを開き、新規作成します。

アクションの追加: 「フォルダを開く」または「Finderで表示」アクションを追加します。

変数の設定: 入力として「テキスト」を受け取るようにし、それをフォルダパスとして指定します。

URLスキームの有効化:

ショートカット名（例: OpenInFinder）を決めます。

これで shortcuts://run-shortcut?name=OpenInFinder&input=/Users/name/Desktop というURLで呼び出せるようになります。

2. 本格的な方法：AppleScript + App化
   より柔軟に制御したい場合は、AppleScriptを「アプリケーション」として書き出し、そのアプリにURLスキームを登録します。

手順 A: AppleScriptの準備
スクリプトエディタで以下のコードを記述し、アプリケーション形式で保存します（例: FinderJump.app）。

<pre>
on open location myURL
    -- "myfinder://Users/path/to/folder" のような形式を想定
    set AppleScript's text item delimiters to "myfinder://"
    set thePath to item 2 of (text items of myURL)
    set AppleScript's text item delimiters to ""
    
    tell application "Finder"
        activate
        if folder (POSIX file thePath as string) exists then
            open (POSIX file thePath as string)
        end if
    end tell
end open location
</pre>

手順 B: Info.plist の編集
保存した FinderJump.app の中身（パッケージの内容を表示）を開き、Contents/Info.plist に以下の設定を追記します。

<pre>
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>Finder Jump URL</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myfinder</string>
        </array>
    </dict>
</array>
</pre>

3. Webアプリ（フロントエンド）からの呼び出し
   URLスキームが登録されたら、Webアプリ側からは通常のリンクとして記述するだけです。

<a href="shortcuts://run-shortcut?name=OpenInFinder&input=/Users/Shared">Finderで開く</a>

<a href="myfinder:///Users/Shared">Finderで開く</a>

あなたのプロンプト
アプリでは、BoxのElementsで閲覧しているフォルダからパス文字列を生成し、ボタンを押すとローカルのエクスプローラー/Finderで開供養にしたい。

アプリケーションはWindowsもmacも両方使うのだが、カスタムURLスキームは共通化するのか？

Box UI Elementsから取得したパスを使って、Windows（エクスプローラー）とMac（Finder）の両方で動作させるには、**「同じカスタムURLスキーム名を使いつつ、各OSで中身の挙動を変える」**という設計が最もスマートです。

これにより、Webアプリ側のコードは OS を問わず my-app://open?path=... のように共通化できます。

1. 全体構成のイメージ
   Webアプリ側はOSを判定してパスの形式（C:\ か /Users/ か）を切り替える必要はありますが、呼び出すスキーム自体は統一可能です。

Webアプリ: ボタンクリック時に my-app://open?path=[エンコードされたパス] を実行。

OS側: 独自のURLスキームハンドラー（スクリプトや実行ファイル）がこれを受け取る。

ハンドラー内: 届いた引数を解析し、OS標準のコマンド（explorer または open）を実行する。

2. Windowsでの実装方法（レジストリ）
   Windowsでは、特定のレジストリを登録することでURLスキームを自作プログラムに関連付けます。

実行スクリプト (Pythonの例: open_path.py)

import sys
import os
import subprocess
from urllib.parse import urlparse, unquote

def main(): # 引数からURLを取得 (例: my-app://open?path=C%3A%5CUsers%5CDesktop)
url = sys.argv[1]
parsed = urlparse(url)

    # クエリパラメータからpathを取得
    query = dict(qc.split("=") for qc in parsed.query.split("&"))
    target_path = unquote(query.get("path", ""))

    if os.path.exists(target_path):
        # エクスプローラーでフォルダを開き、ファイルを選択状態にする場合は /select を使用
        subprocess.run(['explorer', target_path])

if **name** == "**main**":
main()

    レジストリ登録 (.regファイル)

    Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\my-app]
@="URL:My App Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\my-app\shell\open\command]
@="\"C:\\Path\\To\\python.exe\" \"C:\\Path\\To\\open_path.py\" \"%1\""

3. Macでの実装方法（AppleScript / Swift）

Macの場合は、前述の「アプリケーション化」を行い、Info.plist で同じスキーム名（my-app）を定義します。

AppleScript (ハンドラー)

on open location myURL
-- URLからパス部分を抽出するロジック
-- 例: my-app://open?path=/Users/name/Desktop
set AppleScript's text item delimiters to "path="
set thePath to item 2 of (text items of myURL)
set AppleScript's text item delimiters to ""

    -- URLデコードが必要な場合はここで行う（簡易的には以下）
    do shell script "open " & quoted form of thePath

end open location

Webアプリ（フロントエンド）の実装

Box Elements から取得したパスを、共通のURL形式に流し込みます。

const openLocalFolder = (rawPath) => {
// パスをURLエンコードする
const encodedPath = encodeURIComponent(rawPath);
const customUri = `my-app://open?path=${encodedPath}`;

// ブラウザでURLを開く
window.location.href = customUri;
};
