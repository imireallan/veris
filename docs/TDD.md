# SustainabilityAI - Test-Driven Development Guide

## Testing Strategy

Three-layer testing approach:
1. **Unit Tests**: Fast, isolated, no dependencies
2. **Integration Tests**: Test component interactions with real deps
3. **E2E Tests**: Full user flows with Playwright

---

## Frontend Testing (Vitest + Playwright)

### Unit Tests (Vitest)
- Component testing with @testing-library/react
- Utility function testing
- Mock API responses with MSW
- Run: `cd frontend && npm test`

### E2E Tests (Playwright)
- Full user flows: login, assessment creation, theme customization
- Test AI chat interface with mocked responses
- Test document upload and knowledge base
- Run: `cd frontend && npm run playwright`

### Test Structure
```
frontend/
├── app/__tests__/              # Unit tests
│   ├── components/
│   ├── utils/
│   └── models/
└── e2e/                        # E2E tests
    ├── auth.spec.ts
    ├── assessments.spec.ts
    ├── knowledge.spec.ts
    └── theme.spec.ts
```

### Pattern Example
```typescript
// Component test
describe("ScoreIndicator", () => {
  it("displays correct color based on score", () => {
    const { container } = render(
      <ScoreIndicator score={85} />
    );
    expect(container).toHaveClass("bg-green-500");
  });
});

// E2E test
test("create and complete assessment", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password");
  await page.click('button[type="submit"]');
  
  await page.click("text=New Assessment");
  await page.fill('[name="title"]', "Q1 Sustainability Review");
  await page.click("text=Create");
  
  expect(page.url()).toContain("/assessments/");
});
```

---

## Backend Testing (Django)

### Test Categories
- **Unit**: Model methods, utility functions
- **API**: DRF endpoint testing
- **Integration**: Full workflows with database

### Structure
```
backend/
├── pytest.ini
├── conftest.py                 # Shared fixtures
└── tests/
    ├── unit/                   # Model tests
    ├── api/                    # API endpoint tests
    └── integration/            # Full workflow tests
```

### Key Fixtures
```python
# conftest.py
@pytest.fixture
def organization(db):
    return Organization.objects.create(
        name="Test Org",
        slug="test-org"
    )

@pytest.fixture
def user(db, organization):
    return User.objects.create_user(
        email="test@example.com",
        organization=organization,
        role="COORDINATOR"
    )

@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client
```

### Run Tests
```bash
pytest                    # All tests
pytest -m unit           # Unit only
pytest -m api            # API tests only
pytest --cov=.           # With coverage
```

---

## AI Engine Testing (FastAPI)

### Test Categories
- **Unit**: Service functions, prompt generation
- **Integration**: LLM calls (with mocks), vector operations

### Structure
```
ai_engine/
├── tests/
│   ├── unit/
│   │   ├── test_rag.py
│   │   ├── test_chat.py
│   │   └── test_embed.py
│   └── integration/
│       ├── test_endpoints.py
│       └── test_pipeline.py
└── conftest.py
```

### Pattern Example
```python
# Mock LLM provider
@pytest.fixture
def mock_openai(mocker):
    return mocker.patch("openai.ChatCompletion.create")

def test_chat_returns_structured_response(mock_openai):
    mock_openai.return_value = {
        "choices": [{"message": {
            "content": '{"answer": "Test", "sources": []}'
        }}]
    }
    
    response = client.post("/chat", json={
        "query": "test",
        "organization_id": str(uuid4())
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
```

### Run Tests
```bash
pytest                    # All tests
pytest -m unit           # Unit only
```

---

## Test Data Management

### Factories
```python
# backend/tests/factories.py
import factory

class OrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organization
    
    name = factory.Faker("company")
    slug = factory.LazyAttribute(
        lambda o: o.name.lower().replace(" ", "-")
    )
```

### Seed Data
```bash
# Create test organization with sample data
python manage.py loaddata fixtures/test_data.json
```

---

## CI Testing Pipeline

### GitHub Actions Workflow
```
1. Frontend
   ├── tsc --noEmit
   ├── eslint
   └── vitest

2. Backend
   ├── flake8
   ├── mypy
   └── pytest

3. AI Engine
   ├── black --check
   ├── pylint
   └── pytest

4. E2E (if all pass)
   └── playwright (against test stack)
```

### Coverage Requirements
- Frontend: >80% statements
- Backend: >90% (Django models), >70% (API endpoints)
- AI Engine: >80%

---

## Common Testing Pitfalls

1. **E2E Tests in Unit Suite**: Never include Playwright tests in vitest config
2. **Mocking Too Much**: Test real interactions where possible, mock external services only
3. **Flaky Tests**: Use proper waits, not arbitrary timeouts
4. **Test Data Leaks**: Use transactions, rollback after each test
5. **Slow Tests**: Parallelize with pytest-xdist, mock expensive operations
