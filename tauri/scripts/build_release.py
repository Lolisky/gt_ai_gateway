import os
import glob
import subprocess
import sys
import shlex
import shutil
import json
import time


def run_command(command):
    cmd_str = ' '.join(shlex.quote(str(s)) for s in command)
    print(f"🚀 Executing: {cmd_str}")
    start = time.time()
    process = subprocess.run(command)
    elapsed = time.time() - start
    print(f"⏱️  Finished in {elapsed:.1f}s (exit code: {process.returncode})")
    if process.returncode != 0:
        print(f"❌ Error: Command failed with code {process.returncode}", file=sys.stderr)
        sys.exit(process.returncode)


def main():
    if len(sys.argv) < 2:
        print("❌ Error: Missing target argument. Usage: python3 build_release.py <target>")
        sys.exit(1)
        
    target = sys.argv[1]

    # Change working directory to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # 1. Setup paths
    bundle_dir = f"../build/target/{target}/release/bundle"
    macos_dir = os.path.join(bundle_dir, "macos")
    
    apps = glob.glob(os.path.join(macos_dir, "*.app"))
    if not apps:
        print(f"❌ Error: No .app found in {macos_dir}")
        sys.exit(1)
    
    app_path = apps[0]
    app_name = os.path.basename(app_path)
    
    cert_name = os.environ.get("APPLE_SIGNING_IDENTITY")
    apple_id = os.environ.get("APPLE_ID")
    apple_password = os.environ.get("APPLE_PASSWORD")
    apple_team_id = os.environ.get("APPLE_TEAM_ID")
    
    if not cert_name:
        print("❌ Error: APPLE_SIGNING_IDENTITY not set. Skipping signing.")
        sys.exit(1)
        
    entitlements_path = "entitlements.mac.plist"
    if not os.path.exists(entitlements_path):
        print(f"❌ Error: {entitlements_path} not found!")
        sys.exit(1)
    
    # 2. Diagnostic info
    print(f"\n--- Diagnostics ---")
    print(f"Target: {target}")
    print(f"App path: {app_path}")
    print(f"Python arch: {subprocess.run(['python3', '-c', 'import platform; print(platform.machine())'], capture_output=True, text=True).stdout.strip()}")
    print(f"macOS version: {subprocess.run(['sw_vers', '-productVersion'], capture_output=True, text=True).stdout.strip()}")

    # Resolve keychain path (use absolute path to avoid interactive prompts under Rosetta)
    keychain_path = os.path.expanduser("~/Library/Keychains/build.keychain-db")
    if not os.path.exists(keychain_path):
        keychain_path = "build.keychain"
    print(f"Keychain path: {keychain_path}")

    print("\nKeychain list:")
    subprocess.run(["security", "list-keychains"])

    # Unlock keychain explicitly before signing (prevents interactive prompt under Rosetta)
    print("\n--- Unlocking keychain before signing ---")
    run_command(["security", "unlock-keychain", "-p", "build", keychain_path])

    # 2.1 Deep sign the app
    # First, sign the sidecar and any frameworks explicitly just in case
    backend_path = os.path.join(app_path, "Contents", "MacOS", "ai-gateway-backend")
    if os.path.exists(backend_path):
        file_size = os.path.getsize(backend_path)
        print(f"\n--- Signing backend sidecar explicitly (size: {file_size / 1024 / 1024:.1f} MB) ---")
        run_command(["codesign", "--force", "--options=runtime", "--entitlements", entitlements_path, "--sign", cert_name, "--keychain", keychain_path, backend_path])
        
    # 2.2 Sign framework dylibs if any
    frameworks_dir = os.path.join(app_path, "Contents", "Frameworks")
    if os.path.exists(frameworks_dir):
        print("\n--- Signing frameworks explicitly ---")
        for root, dirs, files in os.walk(frameworks_dir):
            for file in files:
                if file.endswith(".dylib") or file.endswith(".framework"):
                    fpath = os.path.join(root, file)
                    run_command(["codesign", "--force", "--options=runtime", "--sign", cert_name, "--keychain", keychain_path, fpath])

    print("\n--- Signing the main app bundle ---")
    run_command(["codesign", "--deep", "--force", "--options=runtime", "--entitlements", entitlements_path, "--sign", cert_name, "--keychain", keychain_path, app_path])
    
    # Verify signature
    print("\n--- Verifying signature ---")
    run_command(["codesign", "--verify", "--deep", "--strict", "--verbose=2", app_path])
    
    # 3. Create DMG
    dmg_out_dir = os.path.join(bundle_dir, "signed_dmg")
    os.makedirs(dmg_out_dir, exist_ok=True)
    
    # Copy app to a temporary directory to create a clean DMG
    dmg_tmp_dir = os.path.join(dmg_out_dir, "dmg_tmp")
    if os.path.exists(dmg_tmp_dir):
        shutil.rmtree(dmg_tmp_dir)
    os.makedirs(dmg_tmp_dir, exist_ok=True)
    
    # Create an Applications symlink in the DMG for easy installation
    os.symlink("/Applications", os.path.join(dmg_tmp_dir, "Applications"))
    shutil.copytree(app_path, os.path.join(dmg_tmp_dir, app_name), symlinks=True)
    
    # Read version from tauri.conf.json
    version = ""
    tauri_conf_path = "../src-tauri/tauri.conf.json"
    try:
        with open(tauri_conf_path, 'r', encoding='utf-8') as f:
            tauri_conf = json.load(f)
            version = tauri_conf.get('version', '')
    except Exception as e:
        print(f"⚠️ Warning: Could not read version from tauri.conf.json: {e}")

    arch = "aarch64" if "aarch64" in target else "x86_64"
    version_suffix = f"_{version}" if version else ""
    dmg_name = app_name.replace(".app", f"{version_suffix}_{arch}.dmg")
    dmg_path = os.path.join(dmg_out_dir, dmg_name)
    
    if os.path.exists(dmg_path):
        os.remove(dmg_path)
        
    print(f"\n--- Creating DMG: {dmg_path} ---")
    run_command(["hdiutil", "create", "-volname", app_name.replace(".app", ""), "-srcfolder", dmg_tmp_dir, "-ov", "-format", "UDBZ", dmg_path])
    
    # Clean up temp dir
    shutil.rmtree(dmg_tmp_dir)
    
    # Sign the DMG
    print("\n--- Signing DMG ---")
    run_command(["codesign", "--force", "--sign", cert_name, "--keychain", keychain_path, dmg_path])
    
    # 4. Notarize
    if apple_id and apple_password and apple_team_id:
        print("\n--- Submitting to Apple Notary Service ---")
        run_command([
            "xcrun", "notarytool", "submit", dmg_path, 
            "--apple-id", apple_id, 
            "--password", apple_password, 
            "--team-id", apple_team_id, 
            "--wait"
        ])
        
        print("\n--- Stapling ticket ---")
        run_command(["xcrun", "stapler", "staple", dmg_path])
    else:
        print("\n⚠️ Warning: APPLE_ID, APPLE_PASSWORD, or APPLE_TEAM_ID missing. Skipping notarization.")
        
    print(f"\n✅ Success! Final DMG located at: {dmg_path}")

if __name__ == "__main__":
    main()
