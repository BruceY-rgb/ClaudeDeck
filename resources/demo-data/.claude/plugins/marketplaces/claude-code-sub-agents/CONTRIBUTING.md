# Contributing to the Claude Code Subagents Collection

We welcome contributions from the community. If you would like to contribute to the project, please follow the guidelines below.

## Adding New Agents

To contribute a new subagent to the collection:

1. **Follow Naming Convention**
    * Use lowercase, hyphen-separated names (e.g., `backend-architect.md`)
    * Name should clearly indicate the agent's domain and role

2. **Use Standard Format**
    * Include proper frontmatter with `name`, `description`, and optional `tools`, `model`
    * Follow the structured format outlined in the [Subagent Format](README.md#-subagent-format) section of the `README.md` file.

3. **Write Clear Descriptions**
    * Description should clearly indicate when the agent should be automatically invoked
    * Include specific keywords and contexts that trigger the agent

4. **Define Specialized Behavior**
    * Include detailed system prompt with role, expertise, and capabilities
    * Define interaction patterns with other agents
    * Specify decision-making frameworks and priorities

5. **Test Integration**
    * Verify the agent can be automatically invoked based on description
    * Test explicit invocation with clear requests
    * Ensure compatibility with existing agent coordination patterns

### Quality Standards

* **Domain Expertise**: Agents should demonstrate deep knowledge in their specialization
* **Clear Boundaries**: Define what the agent does and doesn't handle
* **Integration Ready**: Design for seamless coordination with other agents
* **Consistent Voice**: Maintain professional, helpful, and expert tone

### Submission Process

1. Create the agent file following all standards
2. Test the agent with various invocation patterns
3. Submit a pull request with example use cases
4. Include documentation of the agent's unique value and integration patterns
