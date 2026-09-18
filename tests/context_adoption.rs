use pi_rs::{pi_runtime::PiRuntime, pi_session_store::PiSessionStore};
use serde_json::json;
#[test]
fn adoption_is_request_scoped_and_preserves_history() {
    let path = std::env::temp_dir().join(format!("pi-adoption-{}.jsonl", std::process::id()));
    let _ = std::fs::remove_file(&path);
    let mut store = PiSessionStore::create(&path, json!({"type":"session","version":3,"id":"adoption","cwd":"/tmp"})).unwrap();
    let mut runtime = PiRuntime::default();
    assert!(runtime.step(&mut store, &json!({"event":"adopt_context","messages":[]})).is_err());
    let action = runtime.step(&mut store, &json!({"event":"begin","prompt":"first"})).unwrap();
    assert_eq!(action["type"], "model");
    let before = store.snapshot().unwrap();
    let disk_before = std::fs::read(&path).ok();
    for request in [json!({"event":"adopt_context","requestId":"stale","messages":[]}), json!({"event":"adopt_context","requestId":action["requestId"],"messages":[42]})] {
        assert!(runtime.step(&mut store, &request).is_err());
    }
    let messages = json!([{"role":"user","content":[{"type":"text","text":"summary"}]}]);
    let adopted = runtime.step(&mut store, &json!({"event":"adopt_context","requestId":action["requestId"],"messages":messages})).unwrap();
    assert_eq!(adopted["messages"], messages);
    assert_eq!(store.snapshot().unwrap(), before);
    assert_eq!(std::fs::read(&path).ok(), disk_before);
    runtime.step(&mut store, &json!({"event":"model_result","requestId":action["requestId"],"message":{"role":"assistant","content":[],"stopReason":"stop"}})).unwrap();
    assert!(runtime.step(&mut store, &json!({"event":"adopt_context","requestId":action["requestId"],"messages":[]})).is_err());
    drop(store);
    let _ = std::fs::remove_file(path);
}
