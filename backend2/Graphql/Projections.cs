using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GreenDonut;
using HotChocolate;
using HotChocolate.Fetching;
using HotChocolate.Resolvers;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace backend2
{
  [ExtendObjectType(nameof(Compose))]
  public class ComposeTypeExtension
  {
    public Task<string> GetContentAsync(
      [Parent] Compose compose,
      SupercomposeContext ctx,
      IResolverContext context,
      CancellationToken cancellationToken) =>
      ctx.Composes
        .Where(x => x.Id == compose.Id)
        .Select(x => x.Current.Content)
        .FirstOrDefaultAsync(cancellationToken: cancellationToken);

    public Task<string> GetDirectoryAsync(
      [Parent] Compose compose,
      SupercomposeContext ctx,
      IResolverContext context,
      CancellationToken cancellationToken) =>
      ctx.Composes
        .Where(x => x.Id == compose.Id)
        .Select(x => x.Current.Directory)
        .FirstOrDefaultAsync(cancellationToken: cancellationToken);

    public Task<string?> GetServiceNameAsync(
      [Parent] Compose compose,
      SupercomposeContext ctx,
      IResolverContext context,
      CancellationToken cancellationToken) =>
      ctx.Composes
        .Where(x => x.Id == compose.Id)
        .Select(x => x.Current.ServiceName)
        .FirstOrDefaultAsync(cancellationToken: cancellationToken);

    public Task<bool> GetServiceEnabledAsync(
      [Parent] Compose compose,
      SupercomposeContext ctx,
      IResolverContext context,
      CancellationToken cancellationToken) =>
      ctx.Composes
        .Where(x => x.Id == compose.Id)
        .Select(x => x.Current.ServiceEnabled.Value)
        .FirstOrDefaultAsync(cancellationToken: cancellationToken);
  }
}