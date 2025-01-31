let ws; // WebSocketインスタンス
let pcConnected = false;
let phoneConnected = false;

function hashLoad() {
    const hash = window.location.hash;
    const hashContent = hash.substring(1);
    const keyValuePairs = hashContent.split('&');
    console.log(hash);

    keyValuePairs.forEach(pair => {
        const [key, value] = pair.split('=');
        const decodedValue = decodeURIComponent(value);

        if (key === 'code') {
            code = decodedValue;
            document.getElementById('instance_input').value = code;
            console.log(code);
        } else if (key === 'pass') {
            pass = decodedValue;
            document.getElementById('auth_input').value = pass;
            console.log(pass);
        }
    });

    window.location.hash = '';
}
hashLoad();

function connectWebSocket() {
    const instance = document.getElementById('instance_input').value.trim();
    const url = `wss://cloud.achex.ca/${instance}`;
    const id = "phone";
    const auth = document.getElementById('auth_input').value.trim();

    if (!instance || !auth) {
        alert("リンクコードとリンクPINを入力してください。");
        return;
    }

    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log('WebSocket接続成功');
        document.getElementById('phone_status').innerText = "接続OK";
        document.getElementById('phone_status_card').style.background = "#61b968";

        // 認証情報を送信
        const authData = JSON.stringify({ auth: id});
        ws.send(authData);

        // スマホ接続成功メッセージを送信
        const connectMessage = JSON.stringify({ to: auth, contents: "success" });
        ws.send(connectMessage);
        // スマホ接続成功ログ
        const connectLog = JSON.stringify({ to: id, contents: "success" });
        ws.send(connectLog);
    };

    ws.onmessage = (event) => {
        console.log('受信:', event.data);
        try {
            const data = JSON.parse(event.data);

            // PCからのsuccessメッセージを受信した場合
            if (data.FROM === auth && data.contents === "success") {
                pcConnected = true;
                document.getElementById('pc_status').innerText = "接続OK";
                document.getElementById('pc_status_card').style.background = "#61b968";
            }

            const connectPage = document.getElementById("connect_page");
            setTimeout(() => {
                connectPage.style.opacity = '0';
            }, 1000);
            connectPage.addEventListener("transitionend", () => {
                connectPage.style.display = "none";
            });

            // スマホからのsuccessメッセージを受信した場合（デバッグ用）
            if (data.id === "connect_phone" && data.contents === "success") {
                console.log("スマホからのsuccessを受信");
            }
        } catch (e) {
            console.error("受信データの解析エラー:", e);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket切断');
        document.getElementById('phone_status').innerText = "切断";
        document.getElementById('phone_status_card').style.background = "#b96161";
    };

    ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
        document.getElementById('phone_status').innerText = "エラー";
        document.getElementById('phone_status_card').style.background = "#b96161";
    };
}