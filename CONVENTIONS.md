# CONVENTIONS.md - AI Agents Development Convention
*Version 1.0 - Universal Development Guidelines*
*Last Updated: 2025*

## 🎯 Purpose
This convention defines unified standards for developing AI Agent software, independent of the tool used (Claude Code, Cursor, Terminal, etc.). It aims to ensure maximum efficiency and consistency across all projects.

## 📁 Project Structure

```
project-name/
│
├── .env                    # Environment variables (NEVER commit!)
├── .env.example           # Template for environment variables
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── CONVENTIONS.md        # This file
├── CHANGELOG.md          # Version history
├── requirements.txt      # Python dependencies
├── setup.py             # Package setup
├── Makefile            # Task automation
├── docker-compose.yml   # Docker services
├── Dockerfile          # Container definition
│
├── src/                # Main source code
│   ├── __init__.py
│   ├── agents/        # Agent implementations
│   │   ├── __init__.py
│   │   ├── base_agent.py
│   │   └── specialized_agents/
│   ├── core/          # Core functionality
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── utils.py
│   ├── prompts/       # Prompt templates
│   │   ├── __init__.py
│   │   └── templates/
│   └── integrations/  # External integrations
│       ├── __init__.py
│       └── api_clients/
│
├── tests/             # All tests
│   ├── __init__.py
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── fixtures/     # Test data
│
├── notebooks/         # Jupyter/Experimental notebooks
│   ├── exploration/  # Exploratory analysis
│   └── examples/     # Example implementations
│
├── data/             # Data directory
│   ├── raw/         # Raw data (immutable)
│   ├── processed/   # Processed data
│   └── cache/       # Temporary cache files
│
├── docs/             # Documentation
│   ├── api/         # API documentation
│   ├── guides/      # User guides
│   └── architecture/ # Architecture diagrams
│
├── scripts/          # Utility scripts
│   ├── setup.sh     # Setup script
│   └── deploy.sh    # Deployment script
│
└── configs/          # Configuration files
    ├── default.yaml  # Default configuration
    └── production.yaml
```

## 🔧 Development Standards

### Naming Conventions

#### Files and Directories
- **Python files**: `snake_case.py` (e.g., `base_agent.py`, `text_processor.py`)
- **Directories**: `snake_case/` (e.g., `specialized_agents/`, `api_clients/`)
- **Classes**: `PascalCase` (e.g., `ConversationAgent`, `DataProcessor`)
- **Functions/Methods**: `snake_case` (e.g., `process_message()`, `get_response()`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_TOKENS`, `DEFAULT_MODEL`)
- **Private methods**: `_snake_case` with leading underscore

#### Special Files
- **Tests**: `test_<module_name>.py` (e.g., `test_base_agent.py`)
- **Configuration**: `.yaml` or `.json` format
- **Environment**: `.env` for secrets, `.env.example` as template

### Code Organization

#### Import Order
```python
# 1. Standard library imports
import os
import sys
from typing import List, Dict, Optional

# 2. Third-party imports
import openai
import numpy as np
from pydantic import BaseModel

# 3. Local application imports
from src.core.config import Settings
from src.agents.base_agent import BaseAgent
```

#### Docstrings (Google Style)
```python
def process_agent_response(response: str, max_length: int = 500) -> Dict[str, Any]:
    """Process an agent's response.
    
    Args:
        response: The raw response from the agent
        max_length: Maximum length of processed response
        
    Returns:
        Dictionary containing processed data and metadata
        
    Raises:
        ValueError: If response is empty
    """
```

## 🧪 Testing Standards

### Test Structure
```python
# tests/unit/test_base_agent.py
import pytest
from unittest.mock import Mock, patch

class TestBaseAgent:
    """Test suite for BaseAgent class."""
    
    @pytest.fixture
    def agent(self):
        """Create a test instance of the agent."""
        return BaseAgent(config={"test": True})
    
    def test_initialization(self, agent):
        """Test correct initialization."""
        assert agent is not None
        assert agent.config["test"] is True
    
    @pytest.mark.parametrize("input,expected", [
        ("test", "processed_test"),
        ("", "processed_"),
    ])
    def test_process_input(self, agent, input, expected):
        """Test input processing with various inputs."""
        result = agent.process_input(input)
        assert result == expected
```

### Test Execution
```bash
# Run all tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Unit tests only
pytest tests/unit/

# Specific test file
pytest tests/unit/test_base_agent.py -v
```

## 🚀 Development Workflow

### 1. Project Setup
```bash
# Clone repository
git clone <repository-url>
cd project-name

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
pip install -e .  # Project in development mode

# Setup environment variables
cp .env.example .env
# Fill .env with your values
```

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/agent-improvement

# Commit changes (Conventional Commits)
git add .
git commit -m "feat(agents): add retry logic to base agent"

# Commit types:
# feat: New feature
# fix: Bug fix
# docs: Documentation
# style: Formatting
# refactor: Code restructuring
# test: Tests
# chore: Maintenance
```

### 3. Pre-Commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.0.0
    hooks:
      - id: black
  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.0.0
    hooks:
      - id: mypy
```

## 📦 Dependencies Management

### requirements.txt Structure
```txt
# Core Dependencies
openai>=1.0.0
anthropic>=0.25.0
langchain>=0.1.0

# Data Processing
pandas>=2.0.0
numpy>=1.24.0
pydantic>=2.0.0

# Testing
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-asyncio>=0.21.0

# Development
black>=23.0.0
flake8>=6.0.0
mypy>=1.0.0
pre-commit>=3.0.0

# Utilities
python-dotenv>=1.0.0
pyyaml>=6.0.0
rich>=13.0.0  # For beautiful terminal output
```

## 🔒 Security & Secrets

### Environment Variables
```bash
# .env (NEVER commit!)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
LOG_LEVEL=INFO
ENVIRONMENT=development
```

### .gitignore Standards
```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/

# Data & Secrets
.env
*.db
data/raw/*
data/processed/*
!data/raw/.gitkeep
!data/processed/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.coverage
htmlcov/
.pytest_cache/

# Logs
*.log
logs/
```

## 📊 Logging Standards

```python
import logging
from rich.logging import RichHandler

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)]
)

logger = logging.getLogger(__name__)

# Usage
logger.debug("Debug information")
logger.info("Agent successfully initialized")
logger.warning("Rate limit approaching")
logger.error("API call failed", exc_info=True)
```

## 🎨 Code Quality

### Type Hints
```python
from typing import List, Dict, Optional, Union, Any
from dataclasses import dataclass

@dataclass
class AgentConfig:
    model: str
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    
def create_agent(
    config: AgentConfig,
    tools: Optional[List[str]] = None
) -> 'BaseAgent':
    """Create a configured agent."""
    pass
```

### Error Handling
```python
class AgentError(Exception):
    """Base exception for agent errors."""
    pass

class ConfigurationError(AgentError):
    """Configuration error."""
    pass

try:
    response = agent.process(input_data)
except ConfigurationError as e:
    logger.error(f"Configuration error: {e}")
    raise
except Exception as e:
    logger.exception("Unexpected error")
    # Graceful degradation
    return default_response
```

## 🚢 Deployment Checklist

- [ ] All tests pass successfully
- [ ] Code coverage > 80%
- [ ] No linting errors
- [ ] Documentation updated
- [ ] .env.example updated
- [ ] Version bumped in setup.py
- [ ] CHANGELOG.md updated
- [ ] Secrets removed from code
- [ ] Performance tests completed
- [ ] Security audit performed

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: |
          pip install -r requirements.txt
          pytest --cov=src
          black --check src/
          flake8 src/
```

## 📈 Performance Optimization

### Caching Strategy
```python
from functools import lru_cache
import redis

# In-memory cache for small data
@lru_cache(maxsize=128)
def get_prompt_template(name: str) -> str:
    return load_template(name)

# Redis for distributed caching
cache = redis.Redis(host='localhost', port=6379, decode_responses=True)
```

### Async Operations
```python
import asyncio
from typing import List

async def process_agents_parallel(inputs: List[str]) -> List[str]:
    """Process multiple agents in parallel."""
    tasks = [agent.aprocess(input) for input in inputs]
    return await asyncio.gather(*tasks)
```

## 🛠️ Makefile for Automation

```makefile
.PHONY: help install test lint format clean

help:
	@echo "Available commands:"
	@echo "  install    - Install dependencies"
	@echo "  test       - Run tests"
	@echo "  lint       - Code linting"
	@echo "  format     - Format code"
	@echo "  clean      - Remove cache and temporary files"

install:
	pip install -r requirements.txt
	pip install -e .
	pre-commit install

test:
	pytest --cov=src --cov-report=term-missing

lint:
	flake8 src/ tests/
	mypy src/

format:
	black src/ tests/
	isort src/ tests/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov/
```

## 🐳 Docker Setup

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .
RUN pip install -e .

# Run application
CMD ["python", "-m", "src.main"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - ENVIRONMENT=development
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    ports:
      - "8000:8000"
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: agents_db
      POSTGRES_USER: agent_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 📝 Versioning

Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

Example: `v2.1.3`

## 🚀 Quick Start Commands

```bash
# Initial setup
make install

# Development
make format  # Format code
make lint    # Check code quality
make test    # Run tests

# Docker
docker-compose up -d  # Start services
docker-compose logs -f app  # View logs
docker-compose down  # Stop services

# Production deployment
./scripts/deploy.sh production
```
