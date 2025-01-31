// ランダム文字列生成関数
function generateRandomString(length, type) {
    let characters = '';
    if (type === "inst") {
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    } else if (type === "auth") {
        characters = "0123456789";
    }

    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// ランダムに生成されたAuthとPasswor
const instance = generateRandomString(4, "inst"); // リンクコード
const url = `wss://cloud.achex.ca/${instance}`;
const auth = generateRandomString(4, "auth"); // リンクPIN

document.getElementById('instance_display').innerText = instance;
document.getElementById('auth_display').innerText = auth;

const qrcode = new QRCode(document.getElementById("qr_code"), {
    text: `https://qr-connecting-test.pages.dev/mobile/#code=${instance}&pass=${auth}`,
    width: 120,
    height: 120,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
});
console.log(qrcode);


let ws; // WebSocketインスタンス
let pcConnected = false;
let phoneConnected = false;

// WebSocket接続
ws = new WebSocket(url);

ws.onopen = () => {
    console.log('WebSocket接続成功');
    document.getElementById('pc_status').innerText = "接続OK";
    document.getElementById('pc_status_card').style.background = "#61b968";

    // 認証情報を送信
    const authData = JSON.stringify({ auth: auth});
    ws.send(authData);

    // PC接続成功ログ
    const connectLog = JSON.stringify({ to: auth, contents: "success" });
    ws.send(connectLog);
};

ws.onmessage = (event) => {
    console.log('受信:', event.data);
    try {
        const data = JSON.parse(event.data);

        // スマホからのsuccessメッセージを受信した場合
        if (data.FROM === "phone" && data.contents === "success") {
            phoneConnected = true;
            document.getElementById('phone_status').innerText = "接続OK";
            document.getElementById('phone_status_card').style.background = "#61b968";

            // スマホからのsuccessを受信したら、再度PCのsuccessを送信
            const connectMessage = JSON.stringify({ to: "phone", contents: "success" });
            ws.send(connectMessage);

            const connectPage = document.getElementById("connect_page");
            setTimeout(() => {
                connectPage.style.opacity = '0';
            }, 1000);
            connectPage.addEventListener("transitionend", () => {
                connectPage.style.display = "none";
            });
        }
    } catch (e) {
        console.error("受信データの解析エラー:", e);
    }
};

ws.onclose = () => {
    console.log('WebSocket切断');
    document.getElementById('pc_status').innerText = "切断";
    document.getElementById('pc_status_card').style.background = "#b96161";
};

ws.onerror = (error) => {
    console.error('WebSocketエラー:', error);
    document.getElementById('pc_status').innerText = "エラー";
    document.getElementById('pc_status_card').style.background = "#b96161";
};