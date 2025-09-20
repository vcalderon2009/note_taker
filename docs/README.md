# Note-Taker AI Documentation

This directory contains the complete documentation for the Note-Taker AI Assistant project, designed to be rendered by GitHub Pages.

## Documentation Structure

```
docs/
├── index.md                 # Homepage
├── getting-started.md       # Installation and setup guide
├── architecture.md          # System architecture overview
├── api-reference.md         # Complete API documentation
├── development.md           # Development guide
├── deployment.md            # Production deployment guide
├── features/                # Feature documentation
│   ├── chat-interface.md    # Chat interface guide
│   ├── task-management.md   # Task management features
│   ├── note-organization.md # Note organization features
│   └── memory-system.md     # Memory system features
├── advanced/                # Advanced topics
│   ├── ai-integration.md    # AI integration guide
│   ├── database-schema.md   # Database schema documentation
│   ├── security.md          # Security considerations
│   └── performance.md       # Performance optimization
├── _config.yml             # Jekyll configuration
└── .nojekyll               # GitHub Pages configuration
```

## GitHub Pages Setup

### 1. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "Deploy from a branch"
4. Choose "main" branch and "/docs" folder
5. Save the settings

### 2. Custom Domain (Optional)

1. Add a `CNAME` file to the docs folder with your domain
2. Configure DNS records to point to GitHub Pages
3. Enable HTTPS in repository settings

### 3. Automatic Deployment

The documentation will automatically deploy when you push changes to the main branch. GitHub Pages will:

- Build the Jekyll site from the docs folder
- Serve the documentation at `https://your-username.github.io/note_taker`
- Update automatically on each push

## Local Development

### Prerequisites

- Ruby 2.7+
- Bundler gem
- Jekyll 4.0+

### Setup

```bash
# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# Open in browser
open http://localhost:4000
```

### Customization

The documentation uses Jekyll with the Minima theme. You can customize:

- **Styling**: Edit `_sass/` files
- **Layout**: Modify `_layouts/` files
- **Navigation**: Update `_config.yml`
- **Content**: Edit markdown files

## Documentation Guidelines

### Writing Style

- **Clear and Concise**: Use simple, direct language
- **User-Focused**: Write from the user's perspective
- **Consistent**: Follow established patterns and terminology
- **Complete**: Provide all necessary information

### Markdown Formatting

- Use proper heading hierarchy (H1 → H2 → H3)
- Include code examples with syntax highlighting
- Add links to related sections
- Use tables for structured data
- Include diagrams and screenshots when helpful

### Code Examples

```markdown
```bash
# Command examples
make start
```

```python
# Python code examples
def example_function():
    return "Hello, World!"
```

```typescript
// TypeScript code examples
interface ExampleInterface {
  name: string;
  value: number;
}
```
```

### Images and Assets

- Store images in `assets/` directory
- Use descriptive filenames
- Optimize images for web
- Include alt text for accessibility

## Contributing to Documentation

### Adding New Pages

1. Create a new markdown file in the appropriate directory
2. Add front matter with title and description
3. Update navigation in `_config.yml`
4. Test locally with `bundle exec jekyll serve`

### Updating Existing Pages

1. Edit the markdown file
2. Test changes locally
3. Commit and push to main branch
4. Documentation will auto-deploy

### Review Process

1. Create a pull request for documentation changes
2. Review changes in the GitHub interface
3. Test locally if needed
4. Merge after approval

## Maintenance

### Regular Updates

- Keep documentation current with code changes
- Update screenshots and examples
- Review and improve content regularly
- Check for broken links

### Performance

- Optimize images and assets
- Minimize external dependencies
- Use efficient Jekyll plugins
- Monitor page load times

### SEO

- Use descriptive page titles
- Include meta descriptions
- Add structured data
- Optimize for search engines

## Troubleshooting

### Common Issues

#### Jekyll Build Errors
```bash
# Check Jekyll version
bundle exec jekyll --version

# Update dependencies
bundle update

# Clean and rebuild
bundle exec jekyll clean
bundle exec jekyll build
```

#### GitHub Pages Issues
- Check repository settings
- Verify branch and folder selection
- Review build logs in Actions tab
- Ensure `_config.yml` is valid

#### Local Development Issues
```bash
# Install missing gems
bundle install

# Check Ruby version
ruby --version

# Clear Jekyll cache
bundle exec jekyll clean
```

## Support

For documentation issues:

1. Check this README
2. Review Jekyll documentation
3. Search GitHub issues
4. Create a new issue if needed

---

This documentation is designed to be comprehensive, user-friendly, and easy to maintain. Follow these guidelines to keep it current and helpful for all users.
