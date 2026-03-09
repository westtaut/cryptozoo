export function initTelegram(){
  const tg = window.Telegram?.WebApp;
  if(tg){ tg.expand(); tg.ready(); }
  const user = tg?.initDataUnsafe?.user;
  return { id: String(user?.id || 'local_user'), name: user?.first_name || 'Local Player' };
}
