<?php

declare(strict_types=1);

namespace App\Latte;

use Latte\Compiler\Nodes\AreaNode;
use Latte\Compiler\Nodes\StatementNode;
use Latte\Compiler\PrintContext;
use Latte\Compiler\Tag;
use Latte\ContentType;


/**
 * {spaceless}
 */
class JsonTag extends StatementNode
{
    public AreaNode $content;


    /**
     * @param Tag $tag
     * @return \Generator<int, ?array, array{AreaNode, ?Tag}, static>
     */
    public static function create(Tag $tag): \Generator
    {
        $node = new static;
        [$node->content] = yield;
        return $node;
    }


    public function print(PrintContext $context): string
    {
        return $context->format(
            <<<'XX'
				ob_start('Latte\Essential\Filters::%raw', 4096) %line;
				try {
					%node
				} finally {
					ob_end_flush();
				}
				XX,
            $context->getEscaper()->getContentType() === ContentType::Html
                ? 'spacelessHtmlHandler'
                : 'spacelessText',
            $this->position,
            $this->content,
        );
    }


    public function &getIterator(): \Generator
    {
        yield $this->content;
    }
}

class JsonExtension extends \Latte\Extension {
    public function getTags(): array {
        return ['json' => [JsonTag::class, 'create']];
    }
}
