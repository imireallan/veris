"""Agent engine — provider-agnostic ReAct module for Veris / ESG."""
from typing import Protocol


class AgentLoop(Protocol):
    """ReAct loop interface, extractable beyond Veris."""

    def run(self, query: str) -> str: ...
