# AI 拍貼機：明亮觀光橘 v2＋黑熊珍奶等待動畫

v2 改為明亮橘底，搭配活動主視覺的藍、黃、綠色塊、白色卡片及深藍文字，移除深咖啡背景與霓虹光暈。首頁官方 Logo 已移至「開始體驗」按鈕下方；其餘入口保留品牌識別。首頁縮短間距，並調整手機排版。進度與送單 API 未因本次視覺調整變更。

## 更新範圍

覆蓋同名的 index.html、qr-kiosk.html、kiosk.html、upload.html、download.html，並新增 tourism-theme.css、tourism-progress.js 與 assets/ 內兩張圖片。admin.html、後端、模型設定、訂單資料不需更動。請先備份原站，再一起上傳所有更新檔；不要只上傳 index.html。

這份更新尚未部署至正式網站。保留原本的後端網址與 API。

## 真實完成與動畫

- 0%：照片傳送／建立任務中。
- 25%：伺服器已接受任務。排隊與生成期間停在此步，不按時間增加。
- 50%：伺服器回報 completed，且提供 A、B 兩張結果網址。
- 75%：A 圖已下載、解碼成功。
- 100%：B 圖也已下載、解碼成功，短暫顯示完成後進入選圖。

數字是四個完成里程碑的「流程進度」，不是 AI 運算百分比或剩餘時間估算。動畫與百分比分開，等待時持續搖擺。若需 1% 至 99% 細分真實算圖進度，需要生成服務實際提供此數據，不能單靠前台計時。

連線或圖片載入失敗時，保留同一任務並重查，不重送生成。終止狀態不會顯示完成；返回首頁會停止舊任務的前台監看，並避免晚到回應切換下一位賓客的畫面。返回首頁不會刪除後端已接受的任務。照片上傳未確認成功時請由工作人員核對，勿反覆送出。

## 素材

- assets/taiwan-logo.jpg：觀光署官方原檔，未重畫、變形或加濾鏡。來源：https://admin.taiwan.net.tw/UserFiles/cis/LogoLockup-Orange.jpg
- 官方 CIS 與使用聲明：https://admin.taiwan.net.tw/Organize/Articles?a=199 。請由活動主辦確認相關使用程序。
- assets/taiwan-bear-boba.png：使用內建影像生成製作的原創插圖，搭配 CSS 搖擺及完成跳躍動畫，不含參考影片的角色／標誌／素材。
- 生成提示：Original friendly Taiwan black bear with white V chest marking and orange travel scarf, holding bubble milk tea and waving; playful flat illustration, thick outlines, centered full body, transparent background, no text/logo.

## 驗證

本機使用模擬回應驗證排隊、成功、失敗、圖片讀取失敗、斷線重試和取消舊任務；沒有送出真實照片、消耗生成點數或新增活動訂單。尚需在更新後的實機上以一筆測試確認相機權限、實際模型回應及下載操作。
