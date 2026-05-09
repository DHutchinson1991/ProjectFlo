' start-all-hidden.vbs — Starts BOTH ComfyUI and LM Studio headless.
' One shortcut in shell:startup to rule them all.
'
' Edit paths below to match the remote machine.

Dim portable : portable = "C:\Users\WORK\Documents\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable"

' Both .py files should be in the same folder as this .vbs
Dim scriptDir : scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
Dim comfyPy   : comfyPy   = scriptDir & "comfy-remote.py"
Dim lmsPy     : lmsPy     = scriptDir & "lmstudio-remote.py"
Dim pythonExe : pythonExe  = portable & "\python_embeded\python.exe"

Set shell = CreateObject("WScript.Shell")

' ── 1. ComfyUI  (port 8000 API + port 8001 logs) ────────────────────
shell.Run """" & pythonExe & """ -s """ & comfyPy & """", 0, False

' ── 2. LM Studio (port 1234 API + port 8002 logs) ───────────────────
'       Uses system Python from LM Studio's portable python or PATH.
'       Falls back to ComfyUI's portable Python (stdlib only).
shell.Run """" & pythonExe & """ -s """ & lmsPy & """", 0, False
